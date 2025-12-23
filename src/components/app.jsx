import React, { useEffect, useRef } from "react";
import { App, View, f7 } from "framework7-react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";

import routes from "../js/routes";
import store from "../js/store";

import Navigation from "./Navigation";
import Panels from "./Panels";

import PromHelpers from "../helpers/PromHelpers";
import { LayoutProvider } from "../layout";
import KeyboardsHelper from "../helpers/KeyboardsHelper";

import "moment/dist/locale/vi";

window.timeOutForce = null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const MyApp = () => {
  const forceInTimeout = useRef(null);
  const forceOutTimeout = useRef(null);

  const f7params = {
    name: "Thông báo",
    theme: "ios",
    colors: { primary: "#3E97FF" },
    store: store,
    routes: routes,
    dialog: { buttonOk: "Ok", buttonCancel: "Huỷ" },
    touch: { activeState: false },
    iosTranslucentBars: false,
    iosTranslucentModals: false,
    view: {
      xhrCache: false,
      browserHistory: false,
      browserHistorySeparator: "",
      stackPages: true,
    },
  };

  // ---- Handle notification ----
  const handleNotification = (data) => {
    if (
      data?.data?.id &&
      Number(data?.data?.id) !== Number(localStorage.getItem("_noti_id"))
    ) {
      localStorage.setItem("_noti_id", data?.data?.id);
      f7.views.main.router.navigate(`/notifications/view/${data?.data?.id}/`);
    }
  };

  // ---- Force In/Out handlers with debounce ----
  const onAppForceIn = () => {
    if (forceInTimeout.current) return;
    forceInTimeout.current = setTimeout(() => {
      window.refetchProcessings?.();
      window.refetchWorkTimeSetting?.();
      forceInTimeout.current = null;
    }, 300); // debounce 300ms
  };

  const onAppForceOut = () => {
    if (forceOutTimeout.current) return;
    forceOutTimeout.current = setTimeout(() => {
      window.refetchProcessings?.();
      window.refetchWorkTimeSetting?.();
      KeyboardsHelper.forceOutListener();
      forceOutTimeout.current = null;
    }, 300);
  };

  useEffect(() => {
    // Chỉ chạy với version mới
    // window.__setKeyboardHeight = (heightPx = 0, visible = false) => {
    //   document.documentElement.style.setProperty(
    //     "--f7-keyboard-height-v2",
    //     `${heightPx}px`
    //   );

    //   if (visible) {
    //     const el = document.activeElement;
    //     if (el && typeof el.scrollIntoView === "function") {
    //       setTimeout(() => {
    //         el.scrollIntoView({ block: "center", behavior: "smooth" });
    //       }, 100); // đợi WebView apply padding
    //     }
    //   }
    // };
    // return () => {
    //   delete window.__setKeyboardHeight;
    // };
  }, []);

  useEffect(() => {
    window.APP_READY = true;

    // Attach listeners
    document.body.addEventListener("noti_click.go_noti", handleNotification);
    document.addEventListener("onAppForceIn", onAppForceIn);
    document.addEventListener("onAppForceOut", onAppForceOut);

    const handleBodyClick = KeyboardsHelper.bodyEventListener;
    window.addEventListener("click", handleBodyClick);

    // Hide splash screen safely
    requestAnimationFrame(() => {
      const element = document.getElementById("splash-screen");
      if (element) element.classList.add("hidden");
    });

    // Cleanup listeners on unmount
    return () => {
      document.body.removeEventListener(
        "noti_click.go_noti",
        handleNotification
      );
      document.removeEventListener("onAppForceIn", onAppForceIn);
      document.removeEventListener("onAppForceOut", onAppForceOut);
      window.removeEventListener("click", handleBodyClick);

      // Clear any pending timeouts
      clearTimeout(forceInTimeout.current);
      clearTimeout(forceOutTimeout.current);
    };
  }, []);

  // ---- Back button helper ----
  window.ToBackBrowser = () => {
    const { history } = f7.view.main.router;
    if (history.length === 1 && history[0] === "/") {
      PromHelpers.CLOSE_APP();
    } else {
      f7.views.main.router.back();
    }
    f7.views.main.app.sheet.close();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <App {...f7params}>
        <LayoutProvider>
          <View main className="safe-areas" url="/">
            <Navigation />
          </View>
        </LayoutProvider>
        <Panels />
      </App>
      <ToastContainer
        icon={false}
        theme="colored"
        limit={2}
        autoClose={800}
        draggable={false}
      />
    </QueryClientProvider>
  );
};

export default MyApp;
