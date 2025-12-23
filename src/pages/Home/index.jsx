import React, { useRef, useState } from "react";
import { Link, Page, f7, useStore } from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import moment from "moment";
import { TopBars } from "./components";
import { useQuery, useQueryClient } from "react-query";
import WorkTrackAPI from "../../api/WorkTrack.api";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { SwipeButton } from "swipe-button";
import { PickerCheckInOut } from "@/components";
import { DatePickerWrap } from "@/partials/forms";
import clsx from "clsx";
import { useCheckInOut } from "@/hooks";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import PullToRefresh from "react-simple-pull-to-refresh";

function HomePage(props) {
  let Auth = useStore("Auth");

  const calendarInline = useRef(null);

  const [filters, setFilters] = useState({
    UserIDs: [Auth?.ID],
    Date: new Date(),
  });
  const [updatedKey, setUpdatedKey] = useState(new Date().getTime());

  const queryClient = useQueryClient();

  let { CheckIn, CheckOut, CheckInStorage, CheckOutStorage } = useCheckInOut();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["TimekeepingHome", filters],
    queryFn: async () => {
      let newFilters = {
        UserIDs: filters.UserIDs,
        From: moment(filters.Date).format("YYYY-MM-DD"),
        To: moment(filters.Date).format("YYYY-MM-DD"),
      };
      let { data, headers } = await WorkTrackAPI.List(newFilters);

      let List = data.list?.[0]?.Users?.[0]?.List || [];

      let indexCheckIn = List && List.findIndex((obj) => obj.CheckIn);
      let indexCheckOut = List && List.findIndex((obj) => obj.CheckOut);

      let DateServer = moment(headers?.Date, "MM/DD/YYYY").format("YYYY-MM-DD");

      return {
        CheckIn: indexCheckIn > -1 ? List[indexCheckIn] : null,
        CheckOut: indexCheckOut > -1 ? List[indexCheckOut] : null,
        List: List
          ? List.sort((a, b) => moment(a.CheckIn).diff(moment(b.CheckIn)))
          : List,
        isInOut: DateServer === moment(filters.Date).format("YYYY-MM-DD"),
      };
    },
    enabled: Boolean(Auth && Auth?.ID && filters.Date),
    keepPreviousData: true,
  });

  const handleSuccess = () => {
    console.log("Swipe action completed!");
  };

  return (
    <Page
      className="bg-[#eef3ff]"
      noSwipeback
      noNavbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // onPageInit={onPageInit}
      // onPageBeforeRemove={onPageBeforeRemove}
    >
      <div className="relative h-full overflow-hidden">
        <div className="relative -top-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 420.44 292.72"
          >
            <defs>
              <style
                dangerouslySetInnerHTML={{
                  __html: ".clip-path{clip-path:url(#clip-path);}",
                }}
              />
              <clipPath id="clip-path">
                <path
                  className="fill-none"
                  d="M0,0H420.44a0,0,0,0,1,0,0V267.83a24.89,24.89,0,0,1-24.89,24.89H24.91A24.91,24.91,0,0,1,0,267.8V0A0,0,0,0,1,0,0Z"
                />
              </clipPath>
            </defs>
            <g id="OBJECTS">
              <g>
                <path
                  className="fill-app"
                  d="M0,0H420.44a0,0,0,0,1,0,0V267.83a24.89,24.89,0,0,1-24.89,24.89H24.91A24.91,24.91,0,0,1,0,267.8V0A0,0,0,0,1,0,0Z"
                />
                <path
                  className="fill-[#f5b040]"
                  d="M196-53.6c40.73,126.8,134.83,235.5,254.5,294-1.06-91.85-6.07-184.08-7.13-275.94-.06-5.91-.38-12.46-4.5-16.7-2.69-2.76-6.54-4-10.25-5.05-75.56-21-157.66,9.92-234-8C192.54-62.52,198-56.39,196-53.6Z"
                />
              </g>
            </g>
          </svg>
        </div>

        <div className="absolute top-0 left-0 flex flex-col w-full h-full">
          <div className="pt-safe-t">
            <TopBars {...props} />
          </div>
          <PullToRefresh
            className="flex-grow ezs-ptr ezs-ptr-white"
            onRefresh={() =>
              Promise.all([queryClient.invalidateQueries(["Auth"]), refetch()])
            }
          >
            <div className="overflow-auto grow no-scrollbar">
              <div className="px-4">
                <div className="bg-white rounded-lg">
                  <div className="relative flex items-center justify-between p-4 border-b">
                    <div className="font-medium capitalize">
                      {moment(filters.Date).format(
                        "dddd, [Ngày] DD [T] MM, YYYY"
                      )}
                    </div>
                    <DatePickerWrap
                      value={filters.Date}
                      format="DD/MM/YYYY"
                      onChange={(val) => {
                        setFilters((prevState) => ({
                          ...prevState,
                          Date: val,
                        }));
                      }}
                      label="Chọn ngày"
                    >
                      {({ open }) => (
                        <div
                          onClick={open}
                          className="absolute flex items-center justify-center w-10 h-10 right-1 top-2/4 -translate-y-2/4"
                        >
                          <CalendarDaysIcon className="w-6" />
                        </div>
                      )}
                    </DatePickerWrap>
                  </div>
                  {!isLoading && (
                    <>
                      {data?.List && data?.List.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 p-4">
                          {data?.List?.map((item, index) => (
                            <div className="grid grid-cols-2 gap-4" key={index}>
                              <div className="relative px-3 py-2 overflow-hidden bg-white border rounded box-checkin">
                                <div className="text-gray-600">Vào làm</div>
                                <div className="text-lg font-bold text-success">
                                  {item?.CheckIn
                                    ? moment(
                                        item?.CheckIn,
                                        "YYYY-MM-DD HH:mm"
                                      ).format("HH:mm")
                                    : "--:--"}
                                </div>
                                <ArrowLeftOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-success" />
                              </div>
                              <div className="relative px-3 py-2 bg-white border rounded">
                                <div className="text-gray-600">Ra về</div>
                                <div className="text-lg font-bold text-danger">
                                  {item?.CheckOut
                                    ? moment(
                                        item?.CheckOut,
                                        "YYYY-MM-DD HH:mm"
                                      ).format("HH:mm")
                                    : "--:--"}
                                </div>
                                <ArrowRightOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-danger" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-4 p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative px-3 py-2 overflow-hidden bg-white border rounded box-checkin">
                                <div className="text-gray-600">Vào làm</div>
                                <div className="text-lg font-bold text-success">
                                  --:--
                                </div>
                                <ArrowLeftOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-success" />
                              </div>
                              <div className="relative px-3 py-2 bg-white border rounded">
                                <div className="text-gray-600">Ra về</div>
                                <div className="text-lg font-bold text-danger">
                                  --:--
                                </div>
                                <ArrowRightOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-danger" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {isLoading && (
                    <div className="grid grid-cols-1 gap-4 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative px-3 py-2 overflow-hidden bg-white border rounded animate-pulse box-checkin">
                          <div className="text-gray-600">Vào làm</div>
                          <div className="mt-1 text-lg font-bold text-success">
                            <div role="status">
                              <svg
                                aria-hidden="true"
                                className="w-5 text-gray-200 animate-spin fill-primary"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                  fill="currentFill"
                                />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          </div>
                          <ArrowLeftOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-success" />
                        </div>
                        <div className="relative px-3 py-2 bg-white border rounded animate-pulse">
                          <div className="text-gray-600">Ra về</div>
                          <div className="mt-1 text-lg font-bold text-success">
                            <div role="status">
                              <svg
                                aria-hidden="true"
                                className="w-5 text-gray-200 animate-spin fill-primary"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                  fill="currentFill"
                                />
                              </svg>
                              <span className="sr-only">Loading...</span>
                            </div>
                          </div>
                          <ArrowRightOnRectangleIcon className="absolute w-6 right-3 bottom-3 text-danger" />
                        </div>
                      </div>
                    </div>
                  )}
                  {data?.isInOut && (!CheckIn || !CheckOut) && (
                    <PickerCheckInOut
                      onError={() => {
                        setUpdatedKey(new Date().getTime());
                      }}
                      onSuccess={() => {
                        setUpdatedKey(new Date().getTime());
                      }}
                    >
                      {({ onCheckInOut, onSyncInOut }) => (
                        <div className="w-full px-4 pb-4">
                          {!CheckInStorage && !CheckOutStorage ? (
                            <SwipeButton.Root
                              className={clsx(
                                !CheckIn ? "sw-success" : "sw-danger"
                              )}
                              onSuccess={() => onCheckInOut()}
                              key={updatedKey}
                            >
                              <SwipeButton.Rail>
                                <div
                                  className={clsx(
                                    "slider__shimmer__text font-lato text-[15px]",
                                    !CheckIn?.CheckIn
                                      ? "text-success"
                                      : "text-danger"
                                  )}
                                >
                                  {(!CheckIn?.CheckIn
                                    ? "Vuốt phải chấm công vào làm"
                                    : "Vuốt phải chấm công ra về"
                                  )
                                    .split(" ")
                                    .map((text, index) => (
                                      <span
                                        className="px-[2px]"
                                        key={index}
                                        style={{
                                          "--i": index + 1,
                                        }}
                                      >
                                        {text}
                                      </span>
                                    ))}
                                </div>
                                <div className="slider__shimmer"></div>
                              </SwipeButton.Rail>
                              <SwipeButton.Overlay>
                                Vuốt sang bên phải →
                              </SwipeButton.Overlay>
                              <SwipeButton.Slider>
                                <ChevronRightIcon className="w-6" />
                              </SwipeButton.Slider>
                            </SwipeButton.Root>
                          ) : (
                            <SwipeButton.Root
                              className="sw-warning"
                              onSuccess={() => onSyncInOut()}
                              key={updatedKey}
                            >
                              <SwipeButton.Rail>
                                <div
                                  className={clsx(
                                    "slider__shimmer__text font-lato text-[15px] text-warning"
                                  )}
                                >
                                  {"Vuốt phải đồng bộ dữ liệu"
                                    .split(" ")
                                    .map((text, index) => (
                                      <span
                                        className="px-[2px]"
                                        key={index}
                                        style={{
                                          "--i": index + 1,
                                        }}
                                      >
                                        {text}
                                      </span>
                                    ))}
                                </div>
                                <div className="slider__shimmer"></div>
                              </SwipeButton.Rail>
                              <SwipeButton.Overlay>
                                Vuốt sang bên phải →
                              </SwipeButton.Overlay>
                              <SwipeButton.Slider>
                                <ChevronRightIcon className="w-6" />
                              </SwipeButton.Slider>
                            </SwipeButton.Root>
                          )}
                        </div>
                      )}
                    </PickerCheckInOut>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3.5 mb-4 last:mb-0 w-full">
                  <Link
                    noLinkClass
                    href="/timekeeping/"
                    className="relative p-4 overflow-hidden text-white rounded-lg bg-info"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info-light text-info">
                      <MagnifyingGlassPlusIcon className="w-6" />
                    </div>
                    <div className="mt-4 font-medium">Tra cứu chấm công</div>
                    <div className="absolute pointer-events-none -top-2 -right-2">
                      <img
                        className="w-[120px]"
                        src={AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCoreV2/images/card-image.png",
                          ""
                        )}
                      />
                    </div>
                  </Link>

                  <Link
                    noLinkClass
                    href="/take-break/"
                    className="relative p-4 overflow-hidden text-white rounded-lg bg-danger"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-danger-light text-danger">
                      <CalendarDaysIcon className="w-6" />
                    </div>
                    <div className="mt-4 font-medium">Lịch nghỉ, Xin nghỉ</div>
                    <div className="absolute pointer-events-none -top-2 -right-2">
                      <img
                        className="w-[120px]"
                        src={AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCoreV2/images/card-image.png",
                          ""
                        )}
                      />
                    </div>
                  </Link>

                  <Link
                    noLinkClass
                    href="/statistical/"
                    className="relative p-4 overflow-hidden text-white rounded-lg bg-primary"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light text-primary">
                      <ChartBarIcon className="w-6" />
                    </div>
                    <div className="mt-4 font-medium">Bảng lương tháng</div>
                    <div className="absolute pointer-events-none -top-2 -right-2">
                      <img
                        className="w-[120px]"
                        src={AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCoreV2/images/card-image.png",
                          ""
                        )}
                      />
                    </div>
                  </Link>

                  <Link
                    noLinkClass
                    href="/statistical/day/"
                    className="relative p-4 overflow-hidden text-white rounded-lg bg-warning"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-light text-warning">
                      <PresentationChartLineIcon className="w-6" />
                    </div>
                    <div className="mt-4 font-medium">Bảng lương ngày</div>
                    <div className="absolute pointer-events-none -top-2 -right-2">
                      <img
                        className="w-[120px]"
                        src={AssetsHelpers.toAbsoluteUrlCore(
                          "/AppCoreV2/images/card-image.png",
                          ""
                        )}
                      />
                    </div>
                  </Link>
                </div>
                {Auth.Info?.Groups && Auth.Info?.Groups.length > 0 && (
                  <>
                    {Auth.Info?.Groups.findIndex((x) =>
                      x.Title.toUpperCase().includes("SERVICE")
                    ) > -1 && (
                      <Link
                        noLinkClass
                        href="/technicians/"
                        className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                      >
                        <div className="mb-1 font-semibold uppercase">
                          Dành cho kỹ thuật viên
                        </div>
                        <div className="font-light text-gray-700">
                          Danh sách dịch vụ đã & đang thực hiện, đặt lịch do
                          mình phụ trách.
                        </div>
                      </Link>
                    )}
                    {Auth.Info?.Groups.findIndex((x) =>
                      x.Title.toUpperCase().includes("GIÁO VIÊN")
                    ) > -1 && (
                      <Link
                        noLinkClass
                        href="/courses/"
                        className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                      >
                        <div className="mb-1 font-semibold uppercase">
                          Dành cho giáo viên
                        </div>
                        <div className="font-light text-gray-700">
                          Danh sách các lớp đào tạo spa / thẩm mỹ viện do bạn
                          quản lý
                        </div>
                      </Link>
                    )}
                    {Auth.Info?.Groups.findIndex((x) =>
                      x.Title.toUpperCase().includes("HUẤN LUYỆN VIÊN")
                    ) > -1 && (
                      <Link
                        noLinkClass
                        href="/osclass/"
                        className="flex flex-col items-center p-4 mb-4 text-center rounded-lg last:mb-0 bg-[#fef5e5]"
                      >
                        <div className="mb-1 font-semibold uppercase">
                          Dành cho huấn luyện viên
                        </div>
                        <div className="font-light text-gray-700">
                          Danh sách các lớp tập do bạn quản lý ( điểm danh,
                          thống kê )
                        </div>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </PullToRefresh>
        </div>
      </div>
    </Page>
  );
}

export default HomePage;
