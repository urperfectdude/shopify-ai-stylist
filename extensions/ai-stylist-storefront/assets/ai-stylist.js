(function () {
  function parseProducts(node) {
    const raw = node.getAttribute("data-products");
    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function renderStatus(container, message) {
    container.innerHTML = '<p class="ai-stylist-block__status">' + message + "</p>";
  }

  function createGuestToken() {
    return "guest_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function getGuestToken() {
    try {
      const key = "ai-stylist.try-on-token";
      const existing = window.localStorage.getItem(key);
      if (existing) return existing;
      const next = createGuestToken();
      window.localStorage.setItem(key, next);
      return next;
    } catch {
      return createGuestToken();
    }
  }

  async function addToCart(items) {
    if (!items || !items.length) return;

    await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ items: items }),
    });
  }

  function renderOutfit(container, payload) {
    const cards = (payload.outfit || [])
      .map(function (product) {
        return (
          '<div class="ai-stylist-block__card">' +
          "<strong>" +
          product.title +
          "</strong>" +
          '<div class="ai-stylist-block__meta">' +
          product.productType +
          " · $" +
          product.price +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    const addOnCards = (payload.addOns || [])
      .map(function (product) {
        const variantId =
          product && product.variants && product.variants[0] ? product.variants[0].id : "";
        return (
          '<div class="ai-stylist-block__card">' +
          "<strong>" +
          product.title +
          "</strong>" +
          '<div class="ai-stylist-block__meta">' +
          product.productType +
          " · $" +
          product.price +
          "</div>" +
          '<button type="button" class="ai-stylist-block__button" data-ai-stylist-add data-variant-id="' +
          variantId +
          '">' +
          "Add to cart" +
          "</button>" +
          "</div>"
        );
      })
      .join("");

    container.innerHTML =
      '<div class="ai-stylist-block__card"><strong>Stylist note</strong><div class="ai-stylist-block__meta">' +
      (payload.stylistCopy || "Your outfit is ready.") +
      "</div></div>" +
      cards +
      (addOnCards
        ? '<div class="ai-stylist-block__card"><strong>Add-ons</strong><div class="ai-stylist-block__meta">Complementary picks ready for cart.</div></div>' +
          addOnCards
        : "");
  }

  function renderTryOn(container, payload) {
    container.innerHTML =
      '<div class="ai-stylist-block__card"><strong>Try-on ready</strong><div class="ai-stylist-block__meta">' +
      (payload.product && payload.product.title
        ? "Generated preview for " + payload.product.title
        : "Generated preview ready.") +
      "</div>" +
      (payload.generatedImageUrl
        ? '<img class="ai-stylist-block__image" src="' +
          payload.generatedImageUrl +
          '" alt="AI generated try-on result" />'
        : "") +
      "</div>";
  }

  async function handleGenerate(node) {
    const results = node.querySelector("[data-ai-stylist-results]");
    const apiUrl = node.getAttribute("data-api-url");
    const surface = node.getAttribute("data-surface") || "product";
    const seedProductId = node.getAttribute("data-seed-product-id");
    const handle = node.getAttribute("data-handle");
    const shop = node.getAttribute("data-shop-domain");
    const products = parseProducts(node);

    if (!results || !apiUrl) return;

    renderStatus(results, "Generating outfit recommendations...");

    try {
      const response = await fetch(apiUrl.replace(/\/$/, "") + "/api/storefront/outfits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surface: surface,
          shop: shop || null,
          handle: handle || null,
          seedProductId: seedProductId || null,
          products: products,
          profile: {
            mood: "Effortless",
            occasion: surface === "product" ? "Product detail styling" : "Storefront discovery",
            preferredStyles: ["minimal", "smart casual"],
            preferredColors: ["black", "cream"],
          },
        }),
      });

      const payload = await response.json();
      renderOutfit(results, payload);
    } catch {
      renderStatus(results, "Unable to load AI Stylist right now.");
    }
  }

  async function handleTryOn(node) {
    const results = node.querySelector("[data-ai-stylist-results]");
    const fileInput = node.querySelector("[data-ai-stylist-selfie]");
    const apiUrl = node.getAttribute("data-api-url");
    const handle = node.getAttribute("data-handle");
    const shop = node.getAttribute("data-shop-domain");

    if (!results || !fileInput || !(fileInput instanceof HTMLInputElement) || !apiUrl) return;

    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      renderStatus(results, "Upload a selfie first.");
      return;
    }

    renderStatus(results, "Generating try-on preview...");

    const formData = new FormData();
    formData.append("shop", shop || "");
    formData.append("handle", handle || "");
    formData.append("guestToken", getGuestToken());
    formData.append("selfie", file);

    try {
      const response = await fetch(apiUrl.replace(/\/$/, "") + "/api/storefront/try-on", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        renderStatus(results, payload.error || "Unable to generate try-on preview.");
        return;
      }

      renderTryOn(results, payload);
    } catch {
      renderStatus(results, "Unable to generate try-on preview.");
    }
  }

  document.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const addButton = target.closest("[data-ai-stylist-add]");
    if (addButton instanceof HTMLElement) {
      const variantId = addButton.getAttribute("data-variant-id");
      if (variantId) {
        void addToCart([{ id: variantId, quantity: 1 }]);
      }
      return;
    }

    const button = target.closest("[data-ai-stylist-generate]");
    if (button) {
      const root = button.closest("[data-ai-stylist]");
      if (!root) return;

      void handleGenerate(root);
      return;
    }

    const tryOnButton = target.closest("[data-ai-stylist-try-on]");
    if (!tryOnButton) return;

    const root = tryOnButton.closest("[data-ai-stylist]");
    if (!root) return;

    void handleTryOn(root);
  });
})();
