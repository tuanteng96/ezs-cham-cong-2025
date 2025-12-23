import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Popover,
  Subnavbar,
  f7,
  f7ready,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import {
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  EyeIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import PromHelpers from "@/helpers/PromHelpers";
import AdminAPI from "@/api/Admin.api";
import moment from "moment";
import { useQuery, useQueryClient } from "react-query";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { DatePickerWrap } from "@/partials/forms";
import clsx from "clsx";
import { MenuSubNavbar, PickerFilter } from "./components";
import ConfigsAPI from "@/api/Configs.api";
import DateTimeHelpers from "@/helpers/DateTimeHelpers";
import NoFound from "@/components/NoFound";
import AssetsHelpers from "@/helpers/AssetsHelpers";
import { Fancybox } from "@fancyapps/ui";

const getQueryParams = (queryConfig) => {
  let params = {
    ...queryConfig,
    From: moment(moment(queryConfig.day, "YYYY-MM-DD")),
    To: moment(moment(queryConfig.day, "YYYY-MM-DD")),
    MemberIDs: queryConfig?.MemberIDs
      ? queryConfig?.MemberIDs.map((x) => x.value).toString()
      : "",
    UserIDs: queryConfig?.UserIDs
      ? queryConfig?.UserIDs.map((x) => x.value).toString()
      : "",
    StatusAtHome: queryConfig?.StatusAtHome?.value || "",
    StatusBook: queryConfig?.StatusBook?.value || "",
    StatusMember: queryConfig?.StatusMember?.value || "",
    Tags: queryConfig?.Tags?.value || "",
  };
  switch (queryConfig.view) {
    default:
      params.From = params.From.format("YYYY-MM-DD");
      params.To = params.To.format("YYYY-MM-DD");
  }

  return params;
};

const getStatusClass = (Status, item) => {
  const isAuto =
    item?.Desc && item.Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");
  if (Status === "XAC_NHAN") {
    if (isAuto !== "" && isAuto > -1) return "primary-2";
    return "primary";
  }
  if (Status === "CHUA_XAC_NHAN") {
    return "warning";
  }
  if (Status === "KHACH_KHONG_DEN" || Status === "TU_CHOI") {
    return "danger";
  }
  if (Status === "KHACH_DEN") {
    return "info";
  }
  if (Status === "doing") {
    return "success";
  }
  if (Status === "done") {
    return "secondary";
  }
};

const getClassWrap = (item) => {
  if (item?.Offlines && item.Offlines.length > 0) {
    return "bg-danger border-danger text-white";
  } else if (item?.Book) {
    if (item?.Book?.Status === "doing") {
      return "bg-success border-success text-white";
    }
    if (item?.Book?.Status === "XAC_NHAN") {
      return "bg-primary border-primary text-white";
    }
  } else {
    return "bg-[#fffde0]";
  }
};

const getStatusText = (Status, item) => {
  const isAuto =
    item?.Desc && item.Desc.toUpperCase().indexOf("TỰ ĐỘNG ĐẶT LỊCH");
  if (Status === "XAC_NHAN") {
    if (isAuto !== "" && isAuto > -1) return "Đặt lịch dự kiến";
    return "Đã xác nhận";
  }
  if (Status === "CHUA_XAC_NHAN") {
    return "Chưa xác nhận";
  }
  if (Status === "KHACH_KHONG_DEN") {
    return "Khách không đến";
  }
  if (Status === "KHACH_DEN") {
    return "Khách đến";
  }
  if (Status === "TU_CHOI") {
    return "Khách huỷ lịch";
  }
  if (Status === "doing") {
    return "Đang thực hiện";
  }
  if (Status === "done") {
    return "Thực hiện xong";
  }
};

const checkStar = (item) => {
  if (item?.Member?.MobilePhone !== "0000000000") return "";
  if (item?.Member?.MobilePhone === "0000000000" && item?.IsNew) return "**";
  else {
    return "*";
  }
};

const viLocales = {
  code: "vi",
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 6, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: "Tháng trước",
    next: "Tháng sau",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    list: "Danh sách",
    timeGridWeek: "Tuần",
  },
  weekText: "Sm",
  allDayText: "Cả ngày",
  moreLinkText: "Xem thêm",
  noEventsText: "Không có dữ liệu",
};

function PosAdmin({ f7router }) {
  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let Stocks = useStore("Stocks");

  const queryClient = useQueryClient();

  let Views = [
    {
      ID: 1,
      Index: 1,
      Title: "Danh sách",
      Key: "listWeek",
      visibleCount: true,
    },
    {
      ID: 2,
      Index: 2,
      Title: "Dạng lưới",
      Key: "timeGridDay",
      visibleCount: true,
    },
    {
      ID: 3,
      Index: 3,
      Title: "Nhân viên",
      Key: "resourceTimeGridDay",
      visibleCount: true,
    },
    {
      ID: 4,
      Index: 4,
      Title: "Buồng / Phòng",
      Key: "resourceTimelineDay",
      visibleCount: true,
    },
    {
      ID: 5,
      Index: 5,
      Title: "Nhân viên / Phòng",
      Key: "RoomsTimelineDay",
      visibleCount: true,
    },
    {
      ID: 6,
      Index: 6,
      Title: "Lịch lớp học",
      visibleCount: true,
      Path: "/admin/pos/calendar/class-schedule",
      hidden: !Brand?.Global?.Admin?.lop_hoc_pt,
      Key: "PickerCalendarClass",
    },
    {
      ID: 7,
      Index: 7,
      Title: "Lịch chăm sóc",
      visibleCount: true,
      Path: "/admin/pos/calendar/care-schedule/",
    },
  ];

  const getViewCalendar = () => {
    if (
      Brand?.Global?.Admin?.PosActiveCalendar &&
      Brand?.Global?.Admin?.PosActiveCalendar !== "PickerCalendarClass"
    ) {
      let index = Views.findIndex(
        (x) => x.Key === Brand?.Global?.Admin?.PosActiveCalendar
      );
      if (index > -1) {
        return Views[index].Key;
      }
    }
    return "listWeek";
  };

  const [filters, setFilters] = useState({
    view: getViewCalendar(),
    day: moment().toDate(),
    StockID: CrStocks?.ID || 0,
    MemberIDs: "",
    UserIDs: "",
    status: [
      "XAC_NHAN",
      "XAC_NHAN_TU_DONG",
      "CHUA_XAC_NHAN",
      ...(!Brand?.Global?.Admin?.isAdminBooks ? ["DANG_THUC_HIEN"] : []),
      ...(Brand?.Global?.Admin?.PosStatus
        ? [...Brand?.Global?.Admin?.PosStatus]
        : []),
    ].toString(),
    StatusAtHome: "",
    StatusBook: "",
    StatusMember: "",
    Token: Auth?.token,
  });

  const [TimeOpen, setTimeOpen] = useState(
    Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00"
  );
  const [TimeClose, setTimeClose] = useState(
    Brand?.Global?.APP?.Working?.TimeClose || "23:59:00"
  );

  const calendarRef = useRef("");

  useEffect(() => {
    let index = Stocks ? Stocks.findIndex((x) => x.ID === CrStocks?.ID) : -1;
    if (index > -1) {
      let StockTimes = Stocks[index].KeySEO;
      if (StockTimes) {
        let TimesObj = DateTimeHelpers.formatTimeOpenClose({
          Text: StockTimes,
          InitialTime: {
            TimeOpen: Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00",
            TimeClose: Brand?.Global?.APP?.Working?.TimeClose || "23:59:00",
          },
          Date: moment(filters.day).format("DD-MM-YYYY"),
        });

        let newTimeOpen = moment(TimesObj.TimeOpen, "HH:mm:ss");
        setTimeOpen(
          moment()
            .set({
              hour: newTimeOpen.get("hour"),
              minute: newTimeOpen.get("minute"),
              second: newTimeOpen.get("second"),
            })
            .subtract(TimesObj?.TimeAdd || 0, "minutes")
            .format("HH:mm:ss")
        );
        let newTimeClose = moment(TimesObj.TimeClose, "HH:mm:ss");
        setTimeClose(
          moment()
            .set({
              hour: newTimeClose.get("hour"),
              minute: newTimeClose.get("minute"),
              second: newTimeClose.get("second"),
            })
            .add(TimesObj?.TimeAdd || 0, "minutes")
            .format("HH:mm:ss")
        );
      } else {
        setTimeOpen(Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00");
        setTimeClose(Brand?.Global?.APP?.Working?.TimeClose || "23:59:00");
      }
    } else {
      setTimeOpen(Brand?.Global?.APP?.Working?.TimeOpen || "00:00:00");
      setTimeClose(Brand?.Global?.APP?.Working?.TimeClose || "23:59:00");
    }
  }, [CrStocks, Stocks, filters.day]);

  useEffect(() => {
    if (filters.view === "listWeek" || filters.view === "RoomsTimelineDay")
      return;
    if (calendarRef?.current?.getApi()) {
      setTimeout(() => {
        let calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(filters.view);
      });
    }
  }, [calendarRef, filters.view]);

  useEffect(() => {
    if (calendarRef?.current?.getApi()) {
      let calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(filters.day);
    }
  }, [calendarRef, filters.day]);

  const SettingCalendar = useQuery({
    queryKey: ["SettingCalendar", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ArticleRel`);
      let rs = {
        Tags: "",
        OriginalServices: [],
      };
      if (data?.data && data?.data.length > 0) {
        const result = JSON.parse(data?.data[0].Value);

        if (result) {
          rs = result;
        }
      }
      return rs;
    },
    initialData: {
      Tags: "",
      OriginalServices: [],
    },
  });

  const ResourcesBookings = useQuery({
    queryKey: ["ResourcesBookings", { CrStocks, Auth }],
    queryFn: async () => {
      const { data } = await AdminAPI.listMembersBooking({
        StockID: CrStocks?.ID,
        All: 1,
        Key: "",
        Token: Auth?.token,
      });
      const newData =
        Array.isArray(data?.data) && data?.data.length > 0
          ? data?.data.map((item) => ({
              ...item,
              id: item.id,
              title: item.text,
              order: item?.source?.Order || 0,
            }))
          : [];
      return [{ id: 0, title: "Chưa chọn nhân viên", order: 0 }, ...newData];
    },
    //enabled: filters.view === "resourceTimeGridDay",
  });

  const addResourcesBookings = (newStaffs) => {
    queryClient.setQueryData(
      ["ResourcesBookings", { CrStocks, Auth }],
      (oldData) => {
        if (!oldData) return newStaffs;
        return [...oldData, ...newStaffs];
      }
    );
  };

  const CalendarBookings = useQuery({
    queryKey: ["CalendarBookings", filters],
    queryFn: async () => {
      const { data } = await AdminAPI.calendarBookings({
        ...getQueryParams(filters),
      });

      let StaffsAdd = [];

      let dataBooks =
        data.books && Array.isArray(data.books)
          ? data.books
              .map((item) => {
                let newItem = { ...item };
                if (!item.UserServiceIDs) {
                  newItem.UserServices = [];
                } else {
                  let UserServiceIDsSplit = item.UserServiceIDs.split(",").map(
                    (x) => Number(x)
                  );

                  if (
                    Auth?.Info?.AllGroups &&
                    Auth?.Info?.AllGroups.length > 0
                  ) {
                    newItem.UserServices = Auth?.Info?.AllGroups.flatMap((g) =>
                      Array.isArray(g.Users) ? g.Users : []
                    ) // gom tất cả user
                      .filter((u) => UserServiceIDsSplit.includes(u.ID)) // lọc user có trong UserService
                      .reduce((acc, user) => {
                        // loại trừ trùng ID
                        if (!acc.some((u) => u.ID === user.ID)) acc.push(user);
                        return acc;
                      }, []);
                  } else {
                    newItem.UserServices = [];
                  }
                }
                return newItem;
              })
              .map((item) => {
                let TreatmentJson = item?.TreatmentJson
                  ? JSON.parse(item?.TreatmentJson)
                  : "";

                if (item.UserServices && item.UserServices.length > 0) {
                  for (let u of item.UserServices) {
                    let index = ResourcesBookings?.data?.findIndex(
                      (x) => x.id === u.ID
                    );
                    if (index === -1) {
                      StaffsAdd.push({
                        ...u,
                        id: u.ID,
                        title: u.FullName,
                        order: 99999,
                        isPush: true,
                      });
                    }
                  }
                }

                return {
                  ...item,
                  start: item.BookDate,
                  end: moment(item.BookDate)
                    .add(item.RootMinutes ?? 60, "minutes")
                    .toDate(),
                  title: item.RootTitles,
                  className: `fc-${getStatusClass(
                    item.Status,
                    item
                  )} shadow-lg rounded !mt-0 !ml-0 !mr-0 px-3 py-1.5 text-white`,
                  resourceIds:
                    filters.view === "resourceTimelineDay"
                      ? [TreatmentJson?.ID || TreatmentJson?.value || 0]
                      : item.UserServices &&
                        Array.isArray(item.UserServices) &&
                        item.UserServices.length > 0
                      ? item.UserServices.map((item) => item.ID)
                      : [0],
                  MemberCurrent: {
                    FullName:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.FullName
                        : item?.Member?.FullName,
                    MobilePhone:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.Phone
                        : item?.Member?.MobilePhone,
                  },
                  Star: checkStar(item),
                  isBook: true,
                  MemberPhone: item?.MemberPhone || null,
                };
              })
          : [];

      let dataBooksAuto =
        data.osList && Array.isArray(data.osList)
          ? data.osList.map((item) => {
              if (item.staffs && item.staffs.length > 0) {
                for (let u of item.staffs) {
                  let index = ResourcesBookings?.data?.findIndex(
                    (x) => x.id === u.ID
                  );
                  if (index === -1) {
                    StaffsAdd.push({
                      ...u,
                      id: u.ID,
                      title: u.FullName,
                      order: 99999,
                      isPush: true,
                    });
                  }
                }
              }

              return {
                ...item,
                AtHome: false,
                Member: item.member,
                MemberCurrent: {
                  FullName: item?.member?.FullName,
                  MobilePhone: item?.member?.MobilePhone,
                },
                start: item.os.BookDate,
                end: moment(item.os.BookDate)
                  .add(item.os.RootMinutes ?? 60, "minutes")
                  .toDate(),
                BookDate: item.os.BookDate,
                title: item.os.Title,
                RootTitles: item.os.ProdService2 || item.os.ProdService,
                className: `fc-${getStatusClass(
                  item.os.Status,
                  item
                )} shadow-lg rounded !mt-0 !ml-0 !mr-0 p-3 py-1.5 text-white`,
                resourceIds:
                  filters.view === "resourceTimelineDay"
                    ? [item?.os?.RoomID || 0]
                    : item.staffs &&
                      Array.isArray(item.staffs) &&
                      item.staffs.length > 0
                    ? item.staffs.map((staf) => staf.ID)
                    : [0],
              };
            })
          : [];

      if (StaffsAdd && StaffsAdd.length > 0) {
        addResourcesBookings(StaffsAdd);
      }

      let dataOffline = [];

      if (filters.view === "resourceTimeGridDay") {
        dataBooks = dataBooks.filter(
          (x) =>
            dataBooksAuto.findIndex((o) => o?.Member?.ID === x?.Member?.ID) ===
            -1
        );

        dataOffline =
          data?.dayOffs && data?.dayOffs.length > 0
            ? data?.dayOffs.map((item) => ({
                start: item.From,
                end: item.To,
                resourceIds: [item.UserID],
                display: "background",
                extendedProps: {
                  noEvent: true,
                },
                className: ["fc-no-event"],
              }))
            : [];
        if (data?.userOffs && data?.userOffs.length > 0) {
          for (let useroff of data?.userOffs) {
            if (useroff.dayList && useroff.dayList.length > 0) {
              let i = useroff.dayList.findIndex(
                (x) =>
                  moment(x.Day).format("DD-MM-YYYY") ===
                  moment(filters.From).format("DD-MM-YYYY")
              );
              if (i > -1) {
                let { off } = useroff.dayList[i];
                if (off) {
                  if (off.isOff) {
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(TimeOpen, "HH:mm").get("hour"),
                          minute: moment(TimeOpen, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(TimeClose, "HH:mm").get("hour"),
                          minute: moment(TimeClose, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                  } else {
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(TimeOpen).get("hour"),
                          minute: moment(TimeOpen).get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(off.TimeFrom, "HH:mm").get("hour"),
                          minute: moment(off.TimeFrom, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                    dataOffline.push({
                      start: moment(filters.From)
                        .set({
                          hour: moment(off.TimeTo, "HH:mm").get("hour"),
                          minute: moment(off.TimeTo, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      end: moment(filters.To)
                        .set({
                          hour: moment(TimeClose, "HH:mm").get("hour"),
                          minute: moment(TimeClose, "HH:mm").get("minute"),
                          second: 0,
                        })
                        .toDate(),
                      resourceIds: [useroff.user.ID],
                      display: "background",
                      extendedProps: {
                        noEvent: true,
                      },
                      className: ["fc-no-event"],
                    });
                  }
                }
              }
            }
          }
        }
      }

      return {
        data: [...dataBooks, ...dataBooksAuto, ...dataOffline],
      };
    },
    enabled: Boolean(
      ResourcesBookings?.data?.length > 0 &&
        filters?.view !== "RoomsTimelineDay"
    ),
  });

  const ListRooms = useQuery({
    queryKey: ["ListRoomsBookings", CrStocks],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`room`);
      let rs = [
        {
          RoomTitle: "Room Trống",
          id: 0,
          title: "Room",
        },
      ];
      let roomRs;
      if (data?.data && data?.data.length > 0) {
        const result = JSON.parse(data?.data[0].Value);

        let indexStock = result.findIndex((x) => x.StockID === CrStocks?.ID);
        if (indexStock > -1 && result[indexStock]) {
          roomRs = result[indexStock].ListRooms || [];
          if (
            result[indexStock].ListRooms &&
            result[indexStock].ListRooms.length > 0
          ) {
            for (let Room of result[indexStock].ListRooms) {
              if (Room.Children && Room.Children.length > 0) {
                for (let cls of Room.Children) {
                  rs.push({
                    ...cls,
                    RoomTitle: Room.label,
                    title: cls.label,
                    id: cls.ID,
                  });
                }
              }
            }
          }
        }
      }
      return (
        {
          Rooms: rs,
          RoomsOptions: roomRs,
        } || null
      );
    },
    //enabled: filters.view === "resourceTimelineDay",
  });

  const CalendarBookingsRooms = useQuery({
    queryKey: ["CalendarBookingsRooms", { filters }],
    queryFn: async () => {
      const newFilters = {
        ...getQueryParams(filters),
        IsMassage: true || Brand?.Global?.Admin?.checkout_time,
      };
      const { data, headers } = await AdminAPI.calendarBookings(newFilters);

      let CrDate = moment().toDate();

      let rsRooms = ListRooms?.data?.Rooms || [];
      let dataOffline = [];

      dataOffline =
        data?.dayOffs && data?.dayOffs.length > 0
          ? data?.dayOffs.map((item) => ({
              start: moment(item.From, "YYYY-MM-DD HH:mm:ss").toDate(),
              end: moment(item.To, "YYYY-MM-DD HH:mm:ss").toDate(),
              resourceIds: [item.UserID],
              display: "background",
              extendedProps: {
                noEvent: true,
              },
              className: ["fc-no-event"],
            }))
          : [];
      if (data?.userOffs && data?.userOffs.length > 0) {
        for (let useroff of data?.userOffs) {
          if (useroff.dayList && useroff.dayList.length > 0) {
            let i = useroff.dayList.findIndex(
              (x) =>
                moment(x.Day).format("DD-MM-YYYY") ===
                moment(filters.From).format("DD-MM-YYYY")
            );
            if (i > -1) {
              let { off } = useroff.dayList[i];
              if (off) {
                if (off.isOff) {
                  dataOffline.push({
                    start: moment(filters.From)
                      .set({
                        hour: moment(TimeOpen, "HH:mm").get("hour"),
                        minute: moment(TimeOpen, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    end: moment(filters.To)
                      .set({
                        hour: moment(TimeClose, "HH:mm").get("hour"),
                        minute: moment(TimeClose, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    resourceIds: [useroff.user.ID],
                    display: "background",
                    extendedProps: {
                      noEvent: true,
                    },
                    className: ["fc-no-event"],
                  });
                } else {
                  dataOffline.push({
                    start: moment(filters.From)
                      .set({
                        hour: moment(TimeOpen, "HH:mm").get("hour"),
                        minute: moment(TimeOpen, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    end: moment(filters.To)
                      .set({
                        hour: moment(off.TimeFrom, "HH:mm").get("hour"),
                        minute: moment(off.TimeFrom, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    resourceIds: [useroff.user.ID],
                    display: "background",
                    extendedProps: {
                      noEvent: true,
                    },
                    className: ["fc-no-event"],
                  });
                  dataOffline.push({
                    start: moment(filters.From)
                      .set({
                        hour: moment(off.TimeTo, "HH:mm").get("hour"),
                        minute: moment(off.TimeTo, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    end: moment(filters.To)
                      .set({
                        hour: moment(TimeClose, "HH:mm").get("hour"),
                        minute: moment(TimeClose, "HH:mm").get("minute"),
                        second: 0,
                      })
                      .toDate(),
                    resourceIds: [useroff.user.ID],
                    display: "background",
                    extendedProps: {
                      noEvent: true,
                    },
                    className: ["fc-no-event"],
                  });
                }
              }
            }
          }
        }
      }

      let dataBooks =
        data.books && Array.isArray(data.books)
          ? data.books
              .map((item) => {
                let newItem = { ...item };
                if (!item.UserServiceIDs) {
                  newItem.UserServices = [];
                } else {
                  let UserServiceIDsSplit = item.UserServiceIDs.split(",").map(
                    (x) => Number(x)
                  );

                  if (
                    Auth?.Info?.AllGroups &&
                    Auth?.Info?.AllGroups.length > 0
                  ) {
                    newItem.UserServices = Auth?.Info?.AllGroups.flatMap((g) =>
                      Array.isArray(g.Users) ? g.Users : []
                    ) // gom tất cả user
                      .filter((u) => UserServiceIDsSplit.includes(u.ID)) // lọc user có trong UserService
                      .reduce((acc, user) => {
                        // loại trừ trùng ID
                        if (!acc.some((u) => u.ID === user.ID)) acc.push(user);
                        return acc;
                      }, []);
                  } else {
                    newItem.UserServices = [];
                  }
                }
                return newItem;
              })
              .map((item) => {
                let TreatmentJson = item?.TreatmentJson
                  ? JSON.parse(item?.TreatmentJson)
                  : "";

                return {
                  ...item,
                  start: item.BookDate,
                  end: moment(item.BookDate)
                    .add(item.RootMinutes || 90, "minutes")
                    .toDate(),
                  title: item.RootTitles,
                  className: `fc-event-solid-${getStatusClass(
                    item.Status,
                    item
                  )}`,
                  MemberCurrent: {
                    FullName:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.FullName
                        : item?.Member?.FullName,
                    MobilePhone:
                      item?.IsAnonymous ||
                      item.Member?.MobilePhone === "0000000000"
                        ? item?.Phone
                        : item?.Member?.MobilePhone,
                  },
                  isBook: true,
                  StaffIds:
                    item.UserServices && item.UserServices.length > 0
                      ? item.UserServices.map((x) => x.ID)
                      : [],
                  RoomID: TreatmentJson?.ID || TreatmentJson?.value || "",
                  RoomTitle: TreatmentJson?.label || "",
                };
              })
              .filter((item) => item.Status !== "TU_CHOI")
          : [];

      let dataBooksAuto =
        data.osList && Array.isArray(data.osList)
          ? data.osList.map((item) => {
              let obj = {
                ...item,
                ID: item?.os?.ID,
                Status: item?.os?.Status,
                AtHome: false,
                Member: item.member,
                MemberCurrent: {
                  FullName: item?.member?.FullName,
                  MobilePhone: item?.member?.MobilePhone,
                },
                start: item.os.BookDate,
                end: moment(item.os.BookDate)
                  .add(item.os.RootMinutes || 90, "minutes")
                  .toDate(),
                BookDate: item.os.BookDate,
                title: item.os.Title,
                RootTitles: item.os.ProdService2 || item.os.ProdService,
                className: `fc-event-solid-${getStatusClass(item.os.Status)} ${
                  item?.os?.RoomStatus === "done" ? "bg-stripes" : ""
                }`,
                StaffIds:
                  item.staffs && item.staffs.length > 0
                    ? item.staffs.map((x) => x.ID)
                    : [],
                RoomID: item?.os?.RoomID || "",
                RoomTitle: "",
              };
              let newRooms = rsRooms;

              if (item?.os?.RoomID) {
                let index = newRooms.findIndex(
                  (x) => x.ID === item?.os?.RoomID
                );
                if (index > -1) obj.RoomTitle = newRooms[index].label;
              }
              return obj;
            })
          : [];
      let ListStaffs = ResourcesBookings?.data || [];
      ListStaffs = ListStaffs.map((x) => ({
        ...x,
        id: x.id === 0 ? -1 : x.id,
      }));

      let rs = [];

      if (ListStaffs && ListStaffs.length > 0) {
        for (let staff of ListStaffs) {
          let newStaff = {
            ...staff,
            Offlines: [],
            Books: [],
            NextBooks: [],
            Book: null,
            BooksOs: [],
          };

          if (dataOffline && dataOffline.length > 0) {
            newStaff.Offlines = dataOffline.filter((off) => {
              const start = moment(off.start, "YYYY-MM-DDTHH:mm:ss");
              const end = moment(off.end, "YYYY-MM-DDTHH:mm:ss");
              const current = moment(CrDate);
              const [from, to] = start.isAfter(end)
                ? [end, start]
                : [start, end];

              return (
                off.resourceIds &&
                off.resourceIds.includes(staff.id) &&
                current.isBetween(from, to, null, "[]")
              );
            });
          }

          if (dataBooks && dataBooks.length > 0) {
            let StaffDataBooks = dataBooks.filter(
              (x) =>
                x.StaffIds &&
                x.StaffIds.includes(staff.id) &&
                moment(
                  moment(CrDate).format("YYYY-MM-DD HH:mm"),
                  "YYYY-MM-DD HH:mm"
                ).isBetween(
                  moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                  moment(moment(x.end, "YYYY-MM-DD HH:mm")),
                  null,
                  "[]"
                )
            );
            let StaffNextBooks = dataBooks.filter(
              (x) =>
                x.StaffIds &&
                x.StaffIds.includes(staff.id) &&
                (moment(
                  moment(CrDate).format("YYYY-MM-DD HH:mm"),
                  "YYYY-MM-DD HH:mm"
                ).isBetween(
                  moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                  moment(moment(x.end, "YYYY-MM-DD HH:mm")),
                  null,
                  "[]"
                ) ||
                  moment(
                    moment(CrDate).format("YYYY-MM-DD HH:mm"),
                    "YYYY-MM-DD HH:mm"
                  ).diff(
                    moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                    "minutes"
                  ) <= 0)
            );

            newStaff.Books = [...newStaff.Books, ...StaffDataBooks];

            newStaff.NextBooks = [...newStaff.NextBooks, ...StaffNextBooks];
          }

          if (dataBooksAuto && dataBooksAuto.length > 0) {
            let StaffDataBooksAuto = dataBooksAuto.filter(
              (x) =>
                x.StaffIds &&
                x.StaffIds.includes(staff.id) &&
                moment(
                  moment(CrDate).format("YYYY-MM-DD HH:mm"),
                  "YYYY-MM-DD HH:mm"
                ).isBetween(
                  moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                  moment(moment(x.end, "YYYY-MM-DD HH:mm")),
                  null,
                  "[]"
                ) &&
                x.Status !== "done"
            );

            newStaff.Books = [...newStaff.Books, ...StaffDataBooksAuto];

            newStaff.BooksOs = dataBooksAuto.filter(
              (x) =>
                x.StaffIds &&
                x.StaffIds.includes(staff.id) &&
                (x.Status === "doing" || x.Status === "done")
            );
          }

          if (staff.id === -1) {
            newStaff.NextBooks = dataBooks.filter(
              (x) =>
                (!x.StaffIds || x.StaffIds.length === 0) &&
                (moment(
                  moment(CrDate).format("YYYY-MM-DD HH:mm"),
                  "YYYY-MM-DD HH:mm"
                ).isBetween(
                  moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                  moment(moment(x.end, "YYYY-MM-DD HH:mm")),
                  null,
                  "[]"
                ) ||
                  moment(moment(x.end, "YYYY-MM-DD HH:mm")).isAfter(
                    moment(
                      moment(CrDate).format("YYYY-MM-DD HH:mm"),
                      "YYYY-MM-DD HH:mm"
                    )
                  ))
            );
          }

          rs.push(newStaff);
        }
      }

      rs = rs
        .map((x) => {
          let obj = {
            ...x,
            Books: x.Books.sort(
              (a, b) => new Date(a.BookDate) - new Date(b.BookDate)
            ),
            NextBooks: x.NextBooks.sort(
              (a, b) => new Date(a.BookDate) - new Date(b.BookDate)
            ),
          };
          obj.Book = obj.Books && obj.Books.length > 0 ? obj.Books[0] : null;
          obj.NextBooks = obj.NextBooks?.filter((o) => o?.ID !== obj.Book?.ID);

          if (obj.Book && obj.Book?.os) {
            obj.NextBooks = obj.NextBooks.filter(
              (x) =>
                !moment(
                  moment(x.start).format("YYYY-MM-DD HH:mm"),
                  "YYYY-MM-DD HH:mm"
                ).isBetween(
                  moment(moment(obj.Book?.BookDate, "YYYY-MM-DD HH:mm")),
                  moment(
                    moment(obj.Book?.BookDate, "YYYY-MM-DD HH:mm").add(
                      obj.Book?.os.RootMinutes || 90,
                      "minutes"
                    )
                  ),
                  null,
                  "()"
                )
            );
          }

          return obj;
        })
        .sort((a, b) => {
          const orderA = a.source?.Order ?? 0;
          const orderB = b.source?.Order ?? 0;
          if (orderA !== orderB) return orderA - orderB;

          const idA = a.source?.ID ?? 0;
          const idB = b.source?.ID ?? 0;
          return idA - idB;
        });

      let Rooms = [];

      if (ListRooms?.data?.RoomsOptions) {
        Rooms = ListRooms?.data?.RoomsOptions.map((x) => ({
          label: x.label,
          groupid: x.ID,
          options:
            x.Children && x.Children.length > 0
              ? x.Children.map((o) => {
                  let obj = {
                    ID: o.ID,
                    label: o.label,
                    value: o.ID,
                    Books: [],
                    Book: null,
                    NextBooks: [],
                  };
                  obj.Books = rs
                    .filter((k) => k.Book?.RoomID && k.Book?.RoomID === o.ID)
                    .sort(
                      (a, b) =>
                        new Date(a?.Book?.BookDate) -
                        new Date(b?.Book?.BookDate)
                    );
                  obj.Book =
                    obj.Books && obj.Books.length > 0 && obj.Books[0].Book
                      ? obj.Books[0].Book
                      : null;

                  let RoomNextBooks = [...(dataBooks || [])]
                    .filter(
                      (x) =>
                        x.RoomID &&
                        x.RoomID === o.ID &&
                        (moment(
                          moment(CrDate).format("YYYY-MM-DD HH:mm"),
                          "YYYY-MM-DD HH:mm"
                        ).isBetween(
                          moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                          moment(moment(x.end, "YYYY-MM-DD HH:mm")),
                          null,
                          "[]"
                        ) ||
                          moment(
                            moment(CrDate).format("YYYY-MM-DD HH:mm"),
                            "YYYY-MM-DD HH:mm"
                          ).diff(
                            moment(moment(x.start, "YYYY-MM-DD HH:mm")),
                            "minutes"
                          ) <= 0)
                    )
                    .filter((x) => x.ID !== obj.Book?.ID);

                  if (obj.Book && obj.Book?.os) {
                    RoomNextBooks = RoomNextBooks.filter(
                      (x) =>
                        !moment(
                          moment(x.start).format("YYYY-MM-DD HH:mm"),
                          "YYYY-MM-DD HH:mm"
                        ).isBetween(
                          moment(
                            moment(obj.Book?.BookDate, "YYYY-MM-DD HH:mm")
                          ),
                          moment(
                            moment(obj.Book?.BookDate, "YYYY-MM-DD HH:mm").add(
                              obj.Book?.os.RootMinutes || 90,
                              "minutes"
                            )
                          ),
                          null,
                          "()"
                        )
                    );
                  }

                  obj.NextBooks = RoomNextBooks.sort(
                    (a, b) => new Date(a.BookDate) - new Date(b.BookDate)
                  );
                  return obj;
                })
              : [],
        }));
      }

      return {
        Books: rs,
        Rooms,
      };
    },
    keepPreviousData: true,
    enabled:
      !ResourcesBookings?.isLoading &&
      !ListRooms?.isLoading &&
      filters?.view === "RoomsTimelineDay",
  });

  useEffect(() => {
    const el = calendarRef?.current?.elRef?.current;

    if (!el) return;

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchMoveEnd, { passive: false });

    function handleTouchMove(e) {
      console.log(e);
      //if (!CalendarBookings?.isLoading) CalendarBookings.refetch();
    }

    function handleTouchMoveEnd(e) {
      console.log("end");
    }

    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [calendarRef]);

  return (
    <Page
      className="bg-white"
      name="PosAdmin"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      // ptr
      // onPtrRefresh={(done) => CalendarBookings.refetch().then(() => done())}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            popoverOpen=".popover-setting-pos"
          >
            <Cog6ToothIcon className="w-6" />
          </Link>
          <Popover className="popover-setting-pos w-[220px]">
            <div className="py-3">
              <div className="flex flex-col">
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/setting/"
                  popoverClose
                >
                  <span>Cài đặt bảng lịch</span>
                </Link>
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/locks/"
                  popoverClose
                >
                  <span>Cài đặt khoá lịch</span>
                </Link>
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/rooms/"
                  popoverClose
                >
                  <span>Cài đặt phòng</span>
                </Link>
                <Link
                  className="relative px-4 py-2"
                  noLinkClass
                  href="/admin/pos/calendar/staffs-order/"
                  popoverClose
                >
                  <span>Sắp xếp nhân viên</span>
                </Link>
              </div>
            </div>
          </Popover>
        </NavLeft>
        <NavTitle>
          <DatePickerWrap
            value={filters.day}
            format="DD/MM/YYYY"
            onChange={(val) => {
              setFilters((prevState) => ({
                ...prevState,
                day: val,
              }));

              if (ResourcesBookings?.data?.some((x) => x.isPush)) {
                ResourcesBookings.refetch();
              }
            }}
            label="Chọn ngày"
          >
            {({ open }) => (
              <div
                className="flex items-center justify-center h-full font-medium text-[15px   ]"
                onClick={open}
              >
                {moment(filters.day).format("ddd, [Ngày] DD [T]MM YYYY")}
                <ChevronDownIcon className="w-5 ml-1.5" />
              </div>
            )}
          </DatePickerWrap>
        </NavTitle>
        <NavRight className="h-full">
          <PickerFilter
            initialValues={filters}
            TagsList={
              SettingCalendar?.data?.Tags
                ? SettingCalendar?.data?.Tags.split(",").map((x) => ({
                    label: x,
                    value: x,
                  }))
                : []
            }
            onChange={(values) =>
              setFilters((prevState) => ({ ...prevState, ...values }))
            }
          >
            {({ open }) => (
              <Link
                noLinkClass
                className="!text-white h-full flex item-center justify-center w-12"
                onClick={open}
              >
                <AdjustmentsVerticalIcon className="w-6" />
              </Link>
            )}
          </PickerFilter>
        </NavRight>
        <Subnavbar>
          <MenuSubNavbar
            className="w-full h-full px-2"
            data={Views ? Views.filter((x) => !x.hidden) : []}
            selected={Views.filter((x) => x.Key === filters.view)[0].Index}
            setSelected={(val) => {
              let index = Views.findIndex((x) => x.ID === Number(val));

              if (index > -1) {
                if (Views[index].Path) {
                  f7router.navigate(Views[index].Path);
                } else {
                  setFilters((prevState) => ({
                    ...prevState,
                    view: Views[index].Key,
                  }));
                }
              }
            }}
          />
        </Subnavbar>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="relative h-full">
        {filters.view === "listWeek" && (
          <div className="h-full bg-[var(--f7-page-bg-color)]">
            {!CalendarBookings?.isLoading && (
              <>
                {CalendarBookings?.data?.data &&
                  CalendarBookings?.data?.data.length > 0 && (
                    <div className="flex flex-col h-full gap-3 p-4 overflow-auto">
                      {CalendarBookings?.data?.data &&
                        CalendarBookings?.data?.data.map((item, index) => (
                          <div
                            className="p-4 bg-white rounded-lg"
                            key={index}
                            onClick={() => {
                              let extendedProps = item;
                              if (extendedProps.os) {
                                f7.views.main.router.navigate(
                                  "/admin/pos/calendar/os/?formState=" +
                                    encodeURIComponent(
                                      JSON.stringify({
                                        Os: {
                                          ID: extendedProps.os?.ID,
                                          MemberID:
                                            extendedProps.os?.MemberID || "",
                                          ProdService:
                                            extendedProps.os?.ProdService || "",
                                          ProdService2:
                                            extendedProps.os?.ProdService2 ||
                                            "",
                                          Title: extendedProps.os?.Title || "",
                                        },
                                      })
                                    )
                                );
                              } else {
                                f7.views.main.router.navigate(
                                  "/admin/pos/calendar/add/?formState=" +
                                    encodeURIComponent(
                                      JSON.stringify({
                                        ...extendedProps,
                                        Member: {
                                          FullName:
                                            extendedProps?.Member?.FullName,
                                          MobilePhone:
                                            extendedProps.Member?.MobilePhone,
                                          ID: extendedProps.Member?.ID,
                                        },
                                        Roots: extendedProps.Roots
                                          ? extendedProps.Roots.map((x) => ({
                                              Title: x.Title,
                                              ID: x.ID,
                                            }))
                                          : [],
                                      })
                                    )
                                );
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 font-medium">
                                {item?.AtHome && (
                                  <HomeModernIcon className="inline-block w-4 mr-1.5 align-text-top text-primary" />
                                )}
                                {item?.Star && (
                                  <span
                                    className={clsx(
                                      "pr-1.5",
                                      item?.AtHome && "pl-1.5"
                                    )}
                                  >
                                    ({item?.Star})
                                  </span>
                                )}
                                {item?.MemberCurrent?.FullName ||
                                  "Khách chưa xác định"}
                              </div>
                              <div className="px-2.5 rounded-xl bg-primary-light text-primary font-lato font-medium">
                                {moment(item.BookDate).format("HH:mm")}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">
                                {item.RootTitles || "Chưa chọn dịch vụ"}

                                {Brand?.Global?.Admin?.toi_uu_bang_lich ||
                                !item?.isBook ? (
                                  <></>
                                ) : (
                                  <span className="pl-1.5 font-medium font-lato">
                                    ({item?.BookCount?.Done}/
                                    {item?.BookCount?.Total})
                                  </span>
                                )}
                              </div>
                              {item.UserServices &&
                                item.UserServices.length > 0 && (
                                  <div className="mt-1 text-gray-500">
                                    Thực hiện bởi
                                    <span className="pl-1.5">
                                      {item.UserServices.map(
                                        (x) => x.FullName
                                      ).join(", ")}
                                    </span>
                                  </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                              <div
                                className={clsx(
                                  "w-2 h-2 rounded-full",
                                  "fc-bg-" +
                                    getStatusClass(
                                      item.Status || item?.os?.Status,
                                      item
                                    )
                                )}
                              ></div>
                              <div
                                className={clsx(
                                  "fc-text-" +
                                    getStatusClass(
                                      item.Status || item?.os?.Status,
                                      item
                                    )
                                )}
                              >
                                {getStatusText(
                                  item.Status || item?.os?.Status,
                                  item
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                {(!CalendarBookings?.data?.data ||
                  CalendarBookings?.data?.data.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <NoFound
                      Title="Không có kết quả nào."
                      Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {filters.view === "RoomsTimelineDay" && (
          <div className="h-full bg-[var(--f7-page-bg-color)] flex">
            <div className="flex-1 p-4 overflow-auto pt-9">
              <div className="grid grid-cols-1 gap-x-3 gap-y-8">
                {CalendarBookingsRooms?.data?.Books &&
                  CalendarBookingsRooms?.data?.Books.map((item, index) => (
                    <div
                      className={clsx(
                        "border relative rounded min-h-[140px] cursor-pointer",
                        getClassWrap(item)
                      )}
                      key={index}
                      onClick={() => {
                        if (!item?.Book) {
                          if (!item?.Offlines || item?.Offlines.length === 0) {
                            f7router.navigate(
                              "/admin/pos/calendar/add/?resource=" +
                                JSON.stringify(
                                  item.id !== -1
                                    ? {
                                        value: item.id,
                                        label: item.text,
                                      }
                                    : ""
                                )
                            );
                          }
                        } else {
                          if (item?.Book?.os) {
                            f7router.navigate(
                              `/admin/pos/manage/${item?.Book?.os?.MemberID}/`
                            );
                          } else {
                            f7router.navigate(
                              "/admin/pos/calendar/add/?formState=" +
                                encodeURIComponent(
                                  JSON.stringify({
                                    ...item?.Book,
                                    Member: {
                                      FullName: item?.Book?.Member?.FullName,
                                      MobilePhone:
                                        item?.Book?.Member?.MobilePhone,
                                      ID: item?.Book?.Member?.ID,
                                    },
                                    Roots: item?.Book?.Roots
                                      ? item?.Book?.Roots.map((x) => ({
                                          Title: x.Title,
                                          ID: x.ID,
                                        }))
                                      : [],
                                  })
                                )
                            );
                          }
                        }
                      }}
                    >
                      <div className="absolute flex flex-col items-center w-full left-2/4 -translate-x-2/4 -top-5">
                        <div className="relative p-1 bg-white border rounded-full w-11 h-11 border-primary">
                          <div className="relative cursor-pointer aspect-square">
                            <img
                              className="object-cover object-top w-full h-full rounded-full"
                              src={AssetsHelpers.toAbsoluteUrl(
                                item?.photo,
                                "/"
                              )}
                              alt={item.title}
                              onError={(e) => {
                                if (
                                  e.target.src !==
                                  AssetsHelpers.toAbsoluteUrlCore(
                                    "/AppCore/images/blank.png",
                                    ""
                                  )
                                ) {
                                  e.target.src =
                                    AssetsHelpers.toAbsoluteUrlCore(
                                      "/AppCore/images/blank.png",
                                      ""
                                    );
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                let Photos = [
                                  {
                                    src: item?.photo
                                      ? AssetsHelpers.toAbsoluteUrl(
                                          item?.photo,
                                          "/"
                                        )
                                      : AssetsHelpers.toAbsoluteUrlCore(
                                          "/AppCore/images/blank.png",
                                          ""
                                        ),
                                    thumbSrc: item?.photo
                                      ? AssetsHelpers.toAbsoluteUrl(
                                          item?.photo,
                                          "/"
                                        )
                                      : AssetsHelpers.toAbsoluteUrlCore(
                                          "/AppCore/images/blank.png",
                                          ""
                                        ),
                                  },
                                ];
                                let newPhotoJSON = item?.source?.PhotoJSON
                                  ? JSON.parse(item?.source?.PhotoJSON)
                                  : null;
                                if (newPhotoJSON) {
                                  Photos = [
                                    ...newPhotoJSON.map((x) => ({
                                      src: AssetsHelpers.toAbsoluteUrl(x),
                                      thumbSrc: AssetsHelpers.toAbsoluteUrl(x),
                                    })),
                                  ];
                                }
                                const imgs = Photos;

                                const index = imgs.findIndex(
                                  (x) => x.src === item?.photo
                                );

                                Fancybox.show(imgs, {
                                  startIndex: index,
                                  Carousel: {
                                    Toolbar: {
                                      items: {
                                        downloadImage: {
                                          tpl: `
            <button class="f-button" title="Tải ảnh">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"></path>
              </svg>
            </button>
          `,
                                          click: (carouselInstance, event) => {
                                            try {
                                              const currentIndex =
                                                carouselInstance.getPageIndex();

                                              const current =
                                                imgs?.[currentIndex];

                                              const url =
                                                current?.src ||
                                                current?.downloadSrc ||
                                                current?.thumbSrc ||
                                                "";

                                              if (url) {
                                                PromHelpers.OPEN_LINK(url);
                                              } else {
                                                console.warn(
                                                  "Không tìm thấy URL ảnh hiện tại."
                                                );
                                              }
                                            } catch (err) {
                                              console.error(
                                                "Lỗi lấy slide hiện tại:",
                                                err
                                              );
                                            }
                                          },
                                        },
                                      },
                                      display: {
                                        left: ["counter"],
                                        middle: [
                                          "zoomIn",
                                          "zoomOut",
                                          "rotateCCW",
                                          "rotateCW",
                                        ],
                                        right: ["downloadImage", "close"],
                                      },
                                    },
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-center text-[13px] pt-8 px-2">
                          {item.title}
                          {item.BooksOs && item.BooksOs.length > 0 && (
                            <span className="pl-1">
                              ({item.BooksOs.length})
                            </span>
                          )}
                        </div>

                        {((item.NextBooks && item.NextBooks.length > 0) ||
                          item.Book) && (
                          <div className="px-2 pb-2.5 mt-2.5">
                            {item.Book && (
                              <div
                                className={clsx(
                                  item.NextBooks &&
                                    item.NextBooks.length > 0 &&
                                    "pb-2 mb-2 border-b border-dashed"
                                )}
                              >
                                <div className="text-[13px] font-light">
                                  <div className="mb-px">
                                    {item.Book?.Member?.FullName || ""}
                                    {item.Book?.Member?.MobilePhone ===
                                      "0000000000" && (
                                      <span className="pl-1.5">
                                        ({item.Book?.MemberCurrent?.FullName}-
                                        {item.Book?.MemberCurrent?.MobilePhone})
                                      </span>
                                    )}
                                    {item.Book?.RoomTitle && (
                                      <span className="pl-1">
                                        (Phòng {item.Book?.RoomTitle})
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-medium font-lato">
                                    {moment(item.Book.start).format("HH:mm")}
                                    <span className="px-1">-</span>
                                    {moment(item.Book.end).format("HH:mm")}
                                  </div>
                                </div>
                                {item.Book?.RootTitles && (
                                  <div className="text-[13px] font-light mt-px">
                                    {item.Book?.RootTitles}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.NextBooks && item.NextBooks.length > 0 && (
                              <div>
                                {item.NextBooks.map((book, i) => (
                                  <div
                                    className="p-2 text-black bg-white rounded-[3px] mb-1.5 last:!mb-0"
                                    key={i}
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      if (book?.os) {
                                        f7router.navigate(
                                          `/admin/pos/manage/${book?.os?.MemberID}/`
                                        );
                                      } else {
                                        f7router.navigate(
                                          "/admin/pos/calendar/add/?formState=" +
                                            encodeURIComponent(
                                              JSON.stringify({
                                                ...book,
                                                Member: {
                                                  FullName:
                                                    book?.Member?.FullName,
                                                  MobilePhone:
                                                    book?.Member?.MobilePhone,
                                                  ID: book?.Member?.ID,
                                                },
                                                Roots: book?.Roots
                                                  ? book?.Roots.map((x) => ({
                                                      Title: x.Title,
                                                      ID: x.ID,
                                                    }))
                                                  : [],
                                              })
                                            )
                                        );
                                      }
                                    }}
                                  >
                                    <div className="text-[13px] font-light">
                                      <div className="mb-px">
                                        {book?.Member?.FullName || ""}
                                        {book?.Member?.MobilePhone ===
                                          "0000000000" && (
                                          <span className="pl-1.5">
                                            ({book?.MemberCurrent?.FullName}-
                                            {book?.MemberCurrent?.MobilePhone})
                                          </span>
                                        )}
                                      </div>
                                      <div className="font-medium font-lato">
                                        {moment(book.start).format("HH:mm")}
                                        <span className="px-1">-</span>
                                        {moment(book.end).format("HH:mm")}
                                      </div>
                                    </div>
                                    {book?.RootTitles && (
                                      <div className="text-[13px] font-light mt-px">
                                        {book?.RootTitles}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {CalendarBookingsRooms?.data?.Rooms &&
              CalendarBookingsRooms?.data?.Rooms.length > 0 && (
                <div className="w-[140px] py-4 pr-4 overflow-auto">
                  {CalendarBookingsRooms?.data?.Rooms.map((gr, index) => (
                    <div className="group" key={index}>
                      <div className="relative flex">
                        <div className="relative z-10 pr-2 font-medium text-white bg-primary max-w-[85%] truncate rounded-[3px] px-2 uppercase text-[13px] pt-1 pb-px">
                          {gr.label}
                        </div>
                        <div className="absolute w-full h-[1px] bg-primary top-3 left-0"></div>
                      </div>
                      <div className="flex flex-col gap-1.5 py-3 group-last:!pb-0">
                        {gr.options &&
                          gr.options.map((room, i) => (
                            <div className="bg-white rounded-[4px]" key={i}>
                              <div
                                className="p-2 text-[13px] flex-col flex items-center cursor-pointer"
                                key={i}
                                onClick={() => {
                                  if (!room?.Book) {
                                    f7router.navigate(
                                      "/admin/pos/calendar/add/?TreatmentJson=" +
                                        JSON.stringify({
                                          label: room?.label,
                                          value: room?.value,
                                        })
                                    );
                                  } else {
                                    if (room?.Book?.os) {
                                      f7router.navigate(
                                        `/admin/pos/manage/${room?.Book?.os?.MemberID}/`
                                      );
                                    } else {
                                      f7router.navigate(
                                        "/admin/pos/calendar/add/?formState=" +
                                          encodeURIComponent(
                                            JSON.stringify({
                                              ...room?.Book,
                                              Member: {
                                                FullName:
                                                  room?.Book?.Member?.FullName,
                                                MobilePhone:
                                                  room?.Book?.Member
                                                    ?.MobilePhone,
                                                ID: room?.Book?.Member?.ID,
                                              },
                                              Roots: room?.Book?.Roots
                                                ? room?.Book?.Roots.map(
                                                    (x) => ({
                                                      Title: x.Title,
                                                      ID: x.ID,
                                                    })
                                                  )
                                                : [],
                                            })
                                          )
                                      );
                                    }
                                  }
                                }}
                              >
                                {room.Book ? (
                                  <div
                                    className={clsx(
                                      "w-3.5 h-3.5 rounded-full",
                                      getClassWrap({ Book: room.Book })
                                    )}
                                  ></div>
                                ) : (
                                  <div
                                    className={clsx(
                                      "w-3.5 h-3.5 rounded-full bg-warning"
                                    )}
                                  ></div>
                                )}
                                <div className="mt-1 truncate">
                                  {room.label}
                                </div>

                                {room.Book && (
                                  <div className="w-full text-[13px] font-lato flex justify-center">
                                    {moment(room.Book.start).format("HH:mm")}
                                    <span className="px-px">-</span>
                                    {moment(room.Book.end).format("HH:mm")}
                                  </div>
                                )}
                              </div>
                              {room.NextBooks && room.NextBooks.length > 0 && (
                                <div className="border-t border-dashed text-[13px] grid grid-cols-1 p-1.5 gap-1.5">
                                  {room.NextBooks.map((o, k) => (
                                    <div
                                      className="text-[#3F4254] bg-[#E4E6EF] px-1.5 py-1 rounded-[3px] cursor-pointer text-center font-lato"
                                      key={k}
                                      onClick={() => {
                                        f7router.navigate(
                                          "/admin/pos/calendar/add/?formState=" +
                                            encodeURIComponent(
                                              JSON.stringify({
                                                ...o,
                                                Member: {
                                                  FullName: o?.Member?.FullName,
                                                  MobilePhone:
                                                    o?.Member?.MobilePhone,
                                                  ID: o?.Member?.ID,
                                                },
                                                Roots: o.Roots
                                                  ? o.Roots.map((x) => ({
                                                      Title: x.Title,
                                                      ID: x.ID,
                                                    }))
                                                  : [],
                                              })
                                            )
                                        );
                                      }}
                                    >
                                      {moment(o.start).format("HH:mm")}
                                      <span className="px-px">-</span>
                                      {moment(o.end).format("HH:mm")}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
        <div
          className={clsx(
            "h-full",
            (filters.view === "listWeek" ||
              filters.view === "RoomsTimelineDay") &&
              "hidden"
          )}
        >
          <FullCalendar
            firstDay={1}
            schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
            themeSystem="unthemed"
            locale={viLocales}
            headerToolbar={false}
            plugins={[
              timeGridPlugin,
              resourceTimeGridPlugin,
              resourceTimelinePlugin,
              scrollGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            initialDate={filters.day}
            initialView={filters.view}
            handleWindowResize={true}
            aspectRatio="3"
            editable={false}
            navLinks={true}
            ref={calendarRef}
            events={CalendarBookings?.data?.data || []}
            resources={
              filters.view === "resourceTimelineDay"
                ? ListRooms?.data?.Rooms || []
                : ResourcesBookings?.data || []
            }
            resourceGroupField="RoomTitle"
            resourceOrder={
              filters?.view === "resourceTimelineDay" ? "title" : "order,id"
            }
            views={{
              timeGridDay: {
                allDaySlot: false,
                eventMaxStack: 4,
                slotLabelContent: ({ date, text }) => {
                  return (
                    <>
                      <div className="text-[13px] w-full text-center font-medium pt-1 px-[3px]">
                        {moment(date).format("HH:mm")}
                      </div>
                    </>
                  );
                },
                dayHeaderContent: ({ date, isToday, ...arg }) => {
                  return (
                    <>
                      <div className="mb-1 text-sm">
                        {moment(date).format("ddd")}
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-primary">
                        {moment(date).format("DD")}
                      </div>
                    </>
                  );
                },
                dayHeaders: false,
                nowIndicator: true,
                now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                scrollTime: moment(new Date()).format("HH:mm"),
                slotMinWidth: "45",
                dateClick: ({ date }) => {
                  f7.views.main.router.navigate(
                    "/admin/pos/calendar/add/?BookDate=" + date
                  );
                },
                slotMinTime: TimeOpen,
                slotMaxTime: TimeClose,
              },
              listWeek: {},
              resourceTimeGridDay: {
                dayMinWidth: 200,
                allDaySlot: false,
                type: "resourceTimeline",
                nowIndicator: true,
                now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                scrollTime: moment(new Date()).format("HH:mm"),
                resourceAreaWidth: "200px",
                stickyHeaderDates: true,
                slotMinTime: TimeOpen,
                slotMaxTime: TimeClose,
                buttonText: "Nhân viên",
                resourceAreaHeaderContent: () => "Nhân viên",
                resourceLabelContent: ({ resource }) => {
                  return (
                    <>
                      <div className="py-1.5 capitalize text-primary">
                        {resource._resource.title}
                        {resource.extendedProps?.isPush && (
                          <span className="pl-1 text-sm text-danger">(*)</span>
                        )}
                      </div>
                    </>
                  );
                },
                slotLabelContent: ({ date, text }) => {
                  return (
                    <>
                      <div className="text-[13px] w-full text-center font-medium pt-1 px-[3px]">
                        {moment(date).format("HH:mm")}
                      </div>
                    </>
                  );
                },
                dateClick: ({ resource, jsEvent, date }) => {
                  if (jsEvent.target.classList.contains("fc-no-event")) return;
                  if (resource._resource?.id) {
                    f7.views.main.router.navigate(
                      "/admin/pos/calendar/add/?resource=" +
                        JSON.stringify({
                          label: resource._resource?.title,
                          value: resource._resource?.id,
                        }) +
                        "&BookDate=" +
                        date
                    );
                  }
                },
              },
              resourceTimelineDay: {
                type: "resourceTimelineDay",
                nowIndicator: true,
                now: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                scrollTime: moment(new Date()).format("HH:mm"),
                resourceAreaWidth: "100px",
                slotMinWidth: 50,
                stickyHeaderDates: true,
                slotMinTime: TimeOpen,
                slotMaxTime: TimeClose,
                buttonText: "Phòng",
                resourceAreaHeaderContent: () => "Phòng",
                slotLabelContent: ({ date, text }) => {
                  return (
                    <>
                      <span className="text-primary">
                        {moment(date).format("HH:mm")}
                      </span>
                    </>
                  );
                },
              },
            }}
            eventContent={(arg) => {
              const { event, view } = arg;
              const { extendedProps } = event._def;
              let italicEl = document.createElement("div");
              italicEl.classList.add("fc-content");

              if (
                typeof extendedProps !== "object" ||
                Object.keys(extendedProps).length > 0
              ) {
                if (view.type !== "listWeek") {
                  if (!extendedProps.noEvent) {
                    italicEl.innerHTML = `
              <div class="fc-title">
                <div class="flex">
                  ${
                    extendedProps?.AtHome
                      ? `<div class="mr-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>`
                      : ""
                  }
                  <div class="truncate max-w-2/4 capitalize">
                    ${
                      extendedProps?.Star
                        ? `<span class="pr-[2px]">(${extendedProps?.Star})</span>`
                        : ""
                    }
                    ${
                      extendedProps?.MemberCurrent?.FullName ||
                      "Chưa xác định tên"
                    }
                  </div>
                  <div class="px-[3px]">-</div>
                  <div class="truncate">${
                    extendedProps?.MemberCurrent?.MobilePhone ||
                    "Chưa xác định số"
                  }</div>
                </div>
                <div class="flex items-center">
                  <div>
                    ${moment(extendedProps?.BookDate).format("HH:mm")}
                  </div>
                  <div class="px-[3px]">-</div>
                  <div class="truncate capitalize pr-1">${
                    extendedProps.RootTitles || "Chưa chọn dịch vụ"
                  }</div>
                  <div class='${
                    !Brand?.Global?.Admin?.toi_uu_bang_lich ? "flex" : "hidden"
                  }'>
                    (<span>${extendedProps?.BookCount?.Done || 0}</span>
                    <span class="px2">/</span>
                    <span>${extendedProps?.BookCount?.Total || 0}</span>)
                  </div>
                </div>
              </div>`;
                  }
                } else {
                  italicEl.innerHTML = `<div class="fc-title">
                    <div><span class="fullname">${
                      extendedProps?.AtHome
                        ? `<i class="fas fa-home font-size-xs"></i>`
                        : ""
                    } ${
                    extendedProps?.Star ? `(${extendedProps?.Star})` : ""
                  } ${
                    extendedProps?.MemberCurrent?.FullName ||
                    "Chưa xác định tên"
                  }</span><span class="d-none d-md-inline"> - ${
                    extendedProps?.MemberCurrent?.MobilePhone ||
                    "Chưa xác định số"
                  }</span> 
              <div class="flex${
                filters.view === "listWeek" ? " flex-col" : ""
              }">
                <div class="${
                  filters.view !== "listWeek" ? "truncate " : ""
                }capitalize">${
                    extendedProps.RootTitles || "Chưa chọn dịch vụ"
                  }</div>
                ${
                  filters.view === "listWeek"
                    ? `<span class="${
                        (Brand?.Global?.Admin?.toi_uu_bang_lich ||
                          !extendedProps?.isBook) &&
                        "d-none"
                      } pl-1">(${extendedProps?.BookCount?.Done || 0}/${
                        extendedProps?.BookCount?.Total || 0
                      })</span>`
                    : `<span class="${
                        (Brand?.Global?.Admin?.toi_uu_bang_lich ||
                          !extendedProps?.isBook) &&
                        "d-none"
                      } pl-1">- ${extendedProps?.BookCount?.Done || 0}/${
                        extendedProps?.BookCount?.Total || 0
                      }</span>`
                }
              
              </div>
            </div>
            </div>`;
                }
              } else {
                italicEl.innerHTML = `<div>Chưa có lịch.</div>`;
              }
              let arrayOfDomNodes = [italicEl];
              return {
                domNodes: arrayOfDomNodes,
              };
            }}
            eventClick={({ event, el }) => {
              const { _def } = event;
              const { extendedProps } = _def;

              if (extendedProps?.os) {
                f7.views.main.router.navigate(
                  "/admin/pos/calendar/os/?formState=" +
                    encodeURIComponent(
                      JSON.stringify({
                        Os: {
                          ID: extendedProps.os?.ID,
                          MemberID: extendedProps.os?.MemberID || "",
                          ProdService: extendedProps.os?.ProdService || "",
                          ProdService2: extendedProps.os?.ProdService2 || "",
                          Title: extendedProps.os?.Title || "",
                        },
                      })
                    )
                );
              } else {
                if (!extendedProps.noEvent) {
                  f7.views.main.router.navigate(
                    "/admin/pos/calendar/add/?formState=" +
                      encodeURIComponent(
                        JSON.stringify({
                          ...extendedProps,
                          Member: {
                            FullName: extendedProps?.Member?.FullName,
                            MobilePhone: extendedProps.Member?.MobilePhone,
                            ID: extendedProps.Member?.ID,
                          },
                          Roots: extendedProps.Roots
                            ? extendedProps.Roots.map((x) => ({
                                Title: x.Title,
                                ID: x.ID,
                              }))
                            : [],
                        })
                      )
                  );
                }
              }
            }}
            //   eventDidMount={(el) => {
            //     console.log(el);
            //   }}
            datesSet={({ view, start, ...arg }) => {}}
          />
        </div>
        <div
          role="status"
          className={clsx(
            "absolute left-0 flex items-center justify-center w-full transition h-full top-0 z-10 bg-white/50",
            !CalendarBookings.isLoading &&
              !CalendarBookings.isRefetching &&
              "hidden"
          )}
        >
          <svg
            aria-hidden="true"
            className="w-8 h-8 mr-2 text-gray-300 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="fill-muted"
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
    </Page>
  );
}

export default PosAdmin;
