/**
 * PLANTZ / WooCommerce — paste into the page that embeds Herbie (iframe).
 *
 * Where to add (WordPress):
 * - Appearance → Theme File Editor → footer.php, OR
 * - A "Custom Code" / "Insert Headers and Footers" plugin, OR
 * - Child theme functions.php: wp_enqueue_script + inline script on Herbie page only
 *
 * STAGING: set ALLOWED_IFRAME_ORIGINS and test on https://58l.0d2.myftpupload.com/herbie/
 * PRODUCTION: same script; allow https://ask-herbie-interface.vercel.app
 */

(function () {
  /** Exact origins allowed to send ADD_TO_CART (your Herbie app URLs) */
  var ALLOWED_IFRAME_ORIGINS = [
    "https://ask-herbie-interface.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.6:3000",
  ];

  /** Also allow local dev on any port (localhost, 127.0.0.1, LAN IP) */
  function isAllowedIframeOrigin(origin) {
    if (!origin) return false;
    if (ALLOWED_IFRAME_ORIGINS.indexOf(origin) !== -1) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
      origin,
    );
  }

  var ADD_TYPE = "HERBIE_ADD_TO_CART";
  // Legacy type from older snippets — still accept it
  var ADD_TYPE_LEGACY = "ADD_TO_CART";

  console.info("[Herbie cart] listener loaded on", window.location.origin);
  var UPDATED_TYPE = "HERBIE_CART_UPDATED";
  var ERROR_TYPE = "HERBIE_CART_ERROR";

  function reply(event, payload) {
    if (event.source && event.source.postMessage) {
      event.source.postMessage(payload, event.origin);
    }
  }

  function refreshCartUI() {
    if (typeof jQuery !== "undefined") {
      jQuery(document.body).trigger("wc_fragment_refresh");
      jQuery(document.body).trigger("added_to_cart");
    }
  }

  function addViaWcAjax(productId, quantity) {
    return new Promise(function (resolve, reject) {
      if (
        typeof jQuery === "undefined" ||
        typeof wc_add_to_cart_params === "undefined"
      ) {
        reject(new Error("WooCommerce cart scripts not loaded on this page"));
        return;
      }

      var url = wc_add_to_cart_params.wc_ajax_url.replace(
        "%%endpoint%%",
        "add_to_cart",
      );

      var timedOut = false;
      var ajaxTimeout = window.setTimeout(function () {
        timedOut = true;
        reject(new Error("WooCommerce AJAX timed out"));
      }, 8000);

      jQuery.ajax({
        type: "POST",
        url: url,
        data: {
          product_id: productId,
          quantity: quantity,
        },
        success: function (response) {
          window.clearTimeout(ajaxTimeout);
          if (timedOut) return;
          if (response && response.error) {
            reject(new Error(response.error_message || "Add to cart failed"));
            return;
          }
          refreshCartUI();
          resolve(response);
        },
        error: function () {
          window.clearTimeout(ajaxTimeout);
          if (timedOut) return;
          reject(new Error("WooCommerce AJAX request failed"));
        },
      });
    });
  }

  function addViaRedirect(productId, quantity) {
    var url =
      window.location.origin +
      "/?add-to-cart=" +
      encodeURIComponent(productId) +
      "&quantity=" +
      encodeURIComponent(quantity);
    window.location.href = url;
    return Promise.resolve({ redirected: true });
  }

  window.addEventListener("message", function (event) {
    if (!isAllowedIframeOrigin(event.origin)) {
      return;
    }
    if (!event.data) return;
    var msgType = event.data.type;
    if (msgType !== ADD_TYPE && msgType !== ADD_TYPE_LEGACY) return;

    console.info("[Herbie cart] message from", event.origin, event.data);

    var payload = event.data.payload || event.data;
    var requestId = payload.requestId;
    var productId = parseInt(payload.product_id, 10);
    var quantity = parseInt(payload.quantity, 10) || 1;

    if (!requestId || !productId) {
      reply(event, {
        type: ERROR_TYPE,
        payload: {
          requestId: requestId || "",
          success: false,
          message: "Invalid product_id or requestId",
        },
      });
      return;
    }

    addViaWcAjax(productId, quantity)
      .then(function () {
        reply(event, {
          type: UPDATED_TYPE,
          payload: {
            requestId: requestId,
            success: true,
          },
        });
      })
      .catch(function (err) {
        console.warn("[Herbie cart] wc-ajax failed, trying redirect:", err);
        try {
          addViaRedirect(productId, quantity);
          reply(event, {
            type: UPDATED_TYPE,
            payload: {
              requestId: requestId,
              success: true,
              message: "Redirecting to complete add to cart",
            },
          });
        } catch (e2) {
          reply(event, {
            type: ERROR_TYPE,
            payload: {
              requestId: requestId,
              success: false,
              message: err.message || "Could not add to cart",
            },
          });
        }
      });
  });
})();
