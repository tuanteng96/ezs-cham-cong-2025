import { Link, useStore } from "framework7-react";
import React, { useMemo } from "react";
import clsx from "clsx";
import {
  BanknotesIcon,
  BarsArrowUpIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import RouterHelpers from "../../helpers/RouterHelpers";

function NavigationPos({ pathname, isF7Ready }) {
  let Brand = useStore("Brand");

  const noBottomNav = useMemo(() => {
    return (
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.includes(pathname) ||
      RouterHelpers.BOTTOM_NAVIGATION_PAGES.some(
        (x) => pathname.indexOf(x) > -1
      )
    );
  }, [pathname]);

  if (noBottomNav) {
    return <></>;
  }

  return (
    <>
      {/* <Toolbar
        className="bg-white border-t border-[#EBEDF3]"
        bottom
        inner={false}
        outline={false}
      > */}
      <div className="grid h-full grid-cols-6">
        <Link href="/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/" ? "text-app" : "text-gray-600"
            )}
          >
            <HomeIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Trang chủ</span>
          </div>
        </Link>
        <Link
          href={
            Brand?.Global?.Admin?.PosActiveCalendar === "PickerCalendarClass"
              ? "/admin/pos/calendar/class-schedule"
              : "/admin/pos/calendar/"
          }
        >
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/admin/pos/calendar/" ? "text-app" : "text-gray-600"
            )}
          >
            <CalendarDaysIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Bảng lịch</span>
          </div>
        </Link>

        <Link href="/admin/pos/clients/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/admin/pos/clients/" ? "text-app" : "text-gray-700"
            )}
          >
            <UserGroupIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Khách hàng</span>
          </div>
        </Link>

        <Link href="/admin/pos/orders/">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/admin/pos/orders/" ? "text-app" : "text-gray-600"
            )}
          >
            <DocumentTextIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Hoá đơn</span>
          </div>
        </Link>

        <Link href="/admin/cash/" noLinkClass className="relative">
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1",
              pathname === "/admin/cash/" ? "text-app" : "text-gray-600"
            )}
          >
            <BanknotesIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Sổ quỹ</span>
          </div>
        </Link>

        <Link
          {...(isF7Ready
            ? { panelOpen: "right" }
            : { onClick: (e) => e.preventDefault() })}
        >
          <div
            className={clsx(
              "flex flex-col items-center justify-center pt-1 text-gray-600"
            )}
          >
            <BarsArrowUpIcon className="w-6" />
            <span className="text-[10px] mt-px leading-4">Menu</span>
          </div>
        </Link>
      </div>
      {/* </Toolbar> */}
    </>
  );
}

export default NavigationPos;
