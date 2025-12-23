import React, { useEffect, useMemo, useState } from "react";
import NavigationBase from "./NavigationBase";
import NavigationDivide from "./NavigationDivide";
import { f7, f7ready, Toolbar, useStore } from "framework7-react";
import NavigationPos from "./NavigationPos";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import NavigationInventory from "./NavigationInventory";
import RouterHelpers from "@/helpers/RouterHelpers";
import { AnimatePresence, motion } from "framer-motion";
import NavigationPosAction from "./NavigationPosAction";

let PermissionsUrl = [
  { Url: ["/admin/pos/calendar/"], Redirect: "/", Role: "pos_mng" },
];

const NavigationType = ({ pathname, navKey, isF7Ready }) => {
  if (navKey === "pos") {
    return <NavigationPos pathname={pathname} isF7Ready={isF7Ready} />;
  }

  if (navKey === "inventory") {
    return <NavigationInventory pathname={pathname} isF7Ready={isF7Ready} />;
  }

  if (navKey === "divide") {
    return <NavigationDivide pathname={pathname} isF7Ready={isF7Ready} />;
  }

  return <NavigationBase pathname={pathname} isF7Ready={isF7Ready} />;
};

function Navigation(props) {
  const [pathname, setPathname] = useState("");
  const [isF7Ready, setIsF7Ready] = useState(false);

  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  const PermissionsAll = RolesHelpers.useRoles({
    nameRoles: ["pos_mng"],
    auth: Auth,
    CrStocks,
  });

  useEffect(() => {
    f7ready((f7) => {
      setIsF7Ready(true);
      const currentUrl = f7.views.main?.router?.currentRoute?.url;
      if (currentUrl) {
        setPathname(currentUrl);
        window.PathCurrent = currentUrl;
      }

      const onRouteChange = (newRoute) => {
        const nextUrl =
          newRoute?.url || f7.views.main?.router?.currentRoute?.url || "";
        if (nextUrl) {
          setPathname(nextUrl);
          window.PathCurrent = nextUrl;
        }

        if (window.PlatformId === "ANDROID") {
          if (
            document.activeElement &&
            (document.activeElement.tagName === "INPUT" ||
              document.activeElement.tagName === "TEXTAREA")
          ) {
            document.activeElement.blur();
          }
        }
      };

      f7.views.main.on("routeChange", onRouteChange);

      return () => {
        f7.views.main.off("routeChange", onRouteChange);
      };
    });
  }, []);

  useEffect(() => {
    if (Auth && CrStocks) {
      let index = PermissionsUrl.findIndex(
        (x) => x.Url.includes(pathname) || pathname.indexOf(x.Url) > -1
      );
      if (index > -1) {
        let { hasRight } = PermissionsAll[PermissionsUrl[index].Role];
        if (!hasRight) {
          f7.dialog.alert("Bạn không có quyền truy cập.", () => {
            f7.views.main.router.navigate("/");
          });
        }
      }
    }
  }, [CrStocks?.ID, pathname]);

  const noBottomNav = useMemo(() => {
    return (
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.includes(pathname) ||
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.some(
        (x) => pathname.indexOf(x) > -1
      )
    );
  }, [pathname]);

  // if (noBottomNav) {
  //   return <></>;
  // }

  let navKey = "base";

  if (pathname.includes("pos/") || ["/admin/cash/"].includes(pathname)) {
    navKey = "pos";
  } else if (pathname.includes("/admin/inventory")) {
    navKey = "inventory";
  } else if (Brand?.Global?.Timekeeping?.Version === 1) {
    navKey = "divide";
  }

  return (
    <>
      {[
        "/admin/pos/clients/",
        "/admin/pos/calendar/",
        "/admin/pos/orders/",
        "/admin/cash/",
      ].includes(pathname) && <NavigationPosAction />}

      <Toolbar
        //className="bg-white border-t border-[#EBEDF3]"
        className="bg-transparent"
        bottom
        inner={false}
        outline={false}
        hidden={noBottomNav}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={navKey}
            initial={{ opacity: 0, rotateX: 30, y: 6 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              willChange: "transform, opacity",
              transformOrigin: "bottom center",
              perspective: 600,
            }}
            className="w-full h-full border-t border-[#EBEDF3] bg-white"
          >
            <NavigationType
              pathname={pathname}
              navKey={navKey}
              isF7Ready={isF7Ready}
            />
          </motion.div>
        </AnimatePresence>
      </Toolbar>
    </>
  );
}

export default Navigation;
