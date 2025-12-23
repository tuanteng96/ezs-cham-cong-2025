const addScript = async (src) =>
  new Promise(async (resolve, reject) => {
    const srcBase = src.split("?")[0];

    const existing = Array.from(document.querySelectorAll("script[src]")).find(
      (s) => s.src.split("?")[0] === window.location.origin + srcBase
    );

    if (existing) {
      return resolve();
    }

    const el = document.createElement("script");
    el.src = src;
    el.async = true;

    el.addEventListener("load", resolve);
    el.addEventListener("error", reject);

    const s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(el, s);
  });

const removeScript = async (srcs) =>
  new Promise(async (resolve, reject) => {
    document.querySelectorAll("script").forEach((s) => {
      if (srcs.some((x) => s.src && s.src.indexOf(x))) {
        s.remove();
      }
      resolve();
    });
  });

const CDNHelpers = {
  addScript,
  removeScript,
};
export default CDNHelpers;
