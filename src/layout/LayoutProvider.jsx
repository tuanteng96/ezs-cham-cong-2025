import { f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import store from "../js/store";
import { useQuery, useQueryClient } from "react-query";
import AuthAPI from "../api/Auth.api";
import AdminAPI from "../api/Admin.api";
import DeviceHelpers from "../helpers/DeviceHelpers";
import axios from "axios";
import ConfigsAPI from "../api/Configs.api";
import moment from "moment";
import PromHelpers from "../helpers/PromHelpers";
import CDNHelpers from "@/helpers/CDNHelpers";
import { useFirebase } from "@/hooks";
import { onValue, ref } from "firebase/database";

window.axios = axios;

function LayoutProvider({ children }) {
  let Auth = useStore("Auth");
  let Brand = useStore("Brand");
  let CrStocks = useStore("CrStocks");

  const FirebaseApp = useStore("FirebaseApp");

  const firebase = useFirebase(FirebaseApp);

  const database = firebase?.db;

  const queryClient = useQueryClient();

  const notificationFull = useRef(null);
  const [deferredQueriesReady, setDeferredQueriesReady] = useState(false);

  useEffect(() => {
    if (!window.PlatformVersion) {
      f7.dialog
        .create({
          title: "PHIÊN BẢN MỚI",
          text: "Cập nhật hỗ trợ chấm công Wifi.",
          closeByBackdropClick: "true",
          buttons: [
            {
              text: "Nâng cấp ngay",
              onClick: () => {
                if (window.PlatformId === "ANDROID") {
                  PromHelpers.OPEN_LINK(
                    "https://play.google.com/store/apps/details?id=vn.ezsspa&hl=en&gl=US"
                  );
                } else {
                  PromHelpers.OPEN_LINK(
                    "https://apps.apple.com/us/app/ezs-spa/id6466800951"
                  );
                }
              },
              close: false,
            },
          ],
        })
        .open();
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredQueriesReady(true);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, []);

  const { refetch: refetchAuth } = useQuery({
    queryKey: ["Auth", { Token: Auth?.token, WorkTrackStockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data, headers } = await AuthAPI.checkToken({
        Token: Auth?.token,
        WorkTrackStockID: CrStocks?.ID,
      });

      return {
        data: data
          ? {
              ...data,
              ServerTime: headers?.Date
                ? moment(headers?.Date, "MM/DD/YYYY HH:mm").toDate()
                : moment().toDate(),
            }
          : null,
      };
    },
    onSettled: ({ data }) => {
      
      let hasDomain =
        Brand?.Domain === "https://3amdspa.com" ||
        Brand?.Domain === "https://hdzencare.ezs.vn" ||
        Brand?.Global?.IDS?.isDeviceIdValid;
      if (data?.error) {
        if (data?.error === "TOKEN_KHONG_HOP_LE_2") {
          f7.dialog.alert("Phiên đăng nhập của bạn đã hết hạn.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        } else {
          f7.dialog.alert(data?.error || "Lỗi chưa được xác định.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        }
      } else {
        if (data?.Status !== -1) {
          DeviceHelpers.get({
            success: ({ deviceId, ...deviceProps }) => {
              let { StockInfo, Info } = data;
              let { Stocks } = Info;
              if (
                data.ID !== 1 &&
                StockInfo &&
                Stocks.some(
                  (x) =>
                    typeof x?.IsPublic !== "undefined" &&
                    x.ID === StockInfo?.ID &&
                    !x?.IsPublic
                )
              ) {
                f7.dialog.alert(
                  `Cơ sở ${StockInfo?.Title} đang dừng hoạt động.`,
                  () => {
                    store
                      .dispatch("setLogout")
                      .then(() => f7.views.main.router.navigate("/login/"));
                  }
                );
              }
              if (
                (data &&
                  data.ID &&
                  data.DeviceIDs &&
                  data.DeviceIDs === deviceId) ||
                (data && data.ID && data.ID === 1)
              ) {
                store.dispatch("setAuth", data);
              } else if (
                data &&
                data.ID &&
                data.DeviceIDs &&
                data.ID !== 1 &&
                data.DeviceIDs !== deviceId
              ) {
                if (hasDomain) {
                  f7.dialog.alert(
                    "Tài khoản đang đăng nhập trên thiết bị khác.",
                    () => {
                      store
                        .dispatch("setLogout")
                        .then(() => f7.views.main.router.navigate("/login/"));
                    }
                  );
                } else {
                  store.dispatch("setAuth", data);
                }
              } else if (data && data.ID && !data.DeviceIDs) {
                store.dispatch("setAuth", data);

                // Update lại mã máy
                AdminAPI.saveMachineCode(
                  JSON.stringify({
                    Token: data?.token,
                    data: {
                      updateList: [{ UserID: data.ID, DeviceIDs: deviceId }],
                    },
                  })
                );
              } else if (data) {
                store.dispatch("setAuth", data);
              }

              //Log Theo dõi sự thay đổi mã máy
              DeviceHelpers.updateLog({
                data,
                deviceId,
                deviceProps,
              });
            },
          });
        } else {
          f7.dialog.alert("Tài khoản của bạn đã bị vô hiệu hoá.", () => {
            store
              .dispatch("setLogout")
              .then(() => f7.views.main.router.navigate("/login/"));
          });
        }
      }
    },
    enabled: Boolean(Auth && Auth?.token && deferredQueriesReady),
  });

  window.refetchAuth = refetchAuth;

  useQuery({
    queryKey: ["Brand", Brand?.Domain],
    queryFn: async () => {
      let { data: Config } = await axios.get(
        `${Brand?.Domain}/api/v3/config?cmd=getnames&names=Bill.Title,logo.mau,App.webnoti&ignore_root=1`
      );
      let { data: Global } = await axios.get(
        `${Brand?.Domain}/brand/global/Global.json?${new Date().getTime()}`
      );

      let { data: template } = await axios.get(
        Brand?.Global?.APP?.Home?.Slidernail
          ? `${
              Brand?.Domain
            }/AdminCp/Controls/Noti2/NotiTemplateNail.json?${new Date().getTime()}`
          : `${
              Brand?.Domain
            }/AdminCp/Controls/Noti2/NotiTemplate.json?${new Date().getTime()}`
      );

      return {
        Config: Config?.data || null,
        Global: Global ? { ...Global, ...template } : null,
      };
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    onSettled: ({ Config, Global }) => {
      if (!Config) {
        f7.dialog.alert("Đăng nhập lỗi. Vui lòng đăng nhập lại", () => {
          store
            .dispatch("setLogout")
            .then(() => f7.views.main.router.navigate("/login/"));
        });
      } else {
        let FirebaseApp = null;
        if (Config.filter((x) => x.Name === "App.webnoti").length > 0) {
          let firebaseStr = Config.filter((x) => x.Name === "App.webnoti")[0][
            "ValueText"
          ];

          FirebaseApp = firebaseStr;
        }
        store.dispatch("setBrand", {
          Domain: Brand?.Domain,
          Name: Config.filter((x) => x.Name === "Bill.Title")[0]["ValueText"],
          Logo: Config.filter((x) => x.Name === "logo.mau")[0]["Src"],
          FirebaseApp,
          Global,
        });
      }
    },
    enabled: Boolean(Brand && Brand?.Domain),
  });

  const { refetch: refetchWorkTimeSetting } = useQuery({
    queryKey: ["WorkTimeSetting", Auth?.WorkTimeSetting],
    queryFn: async () => {
      let { data, headers } = await ConfigsAPI.getValue(
        "calamviecconfig,congcaconfig"
      );
      let WorkOptionsRoster = null;
      if (Brand?.Global?.Admin?.roster) {
        let { data: rsRoster } = await AdminAPI.getRosters({
          data: {
            pi: 1,
            filter: {
              Mon: moment(headers.Date, "MM/DD/YYYY").format("YYYY-MM"), //"2025-09"
              Status: "",
              StockID: Auth?.StockID,
            },
          },
          Token: Auth?.token,
        });
        if (rsRoster?.items && rsRoster?.items?.length > 0) {
          let { Data } = rsRoster?.items[0];
          let CrRoster = Data?.Users
            ? Data?.Users?.find((x) => x.UserID === Auth?.ID)
            : null;

          let CrRosterDate = CrRoster?.Dates
            ? CrRoster?.Dates?.find(
                (x) =>
                  moment(x.Date, "YYYY-MM-DD").format("YYYY-MM-DD") ===
                  moment(headers.Date, "MM/DD/YYYY").format("YYYY-MM-DD")
              )
            : null;
          WorkOptionsRoster = CrRosterDate?.WorkShiftType || null;
        }
      }

      return {
        WorkTimes:
          data.data &&
          data.data.filter((x) => x.Name === "calamviecconfig").length > 0
            ? data.data.filter((x) => x.Name === "calamviecconfig")[0].Value
            : null,
        WorkShifts:
          data.data &&
          data.data.filter((x) => x.Name === "congcaconfig").length > 0
            ? data.data.filter((x) => x.Name === "congcaconfig")[0].Value
            : null,
        CrDate: headers?.Date,
        WorkOptionsRoster,
      };
    },
    onSettled: ({ WorkTimes, WorkShifts, CrDate, WorkOptionsRoster }) => {
      let WorkTimeSetting = WorkTimes ? JSON.parse(WorkTimes) : null;
      let WorkShiftsSetting = WorkShifts ? JSON.parse(WorkShifts) : null;
      let AuthWorkTimeSetting = Auth?.WorkTimeSetting
        ? JSON.parse(Auth?.WorkTimeSetting)
        : null;

      let WorkTimeToday = null;

      if (WorkTimeSetting) {
        let indexWorkTime =
          WorkTimeSetting &&
          WorkTimeSetting.findIndex(
            (x) => x.ID === AuthWorkTimeSetting?.ShiftID
          );

        if (indexWorkTime > -1) {
          let { Days, flexible, Options } = WorkTimeSetting[indexWorkTime];
          if (flexible) {
            WorkTimeToday = {
              flexible,
              Options,
              SalaryHours: AuthWorkTimeSetting?.SalaryHours || 0,
            };
          } else if (Days && Days.length > 0) {
            let indexDays = Days.findIndex(
              (x) =>
                x.Title === moment(CrDate, "MM/DD/YYYY HH:mm:ss").format("dddd")
            );
            WorkTimeToday = Days[indexDays];
            WorkTimeToday.SalaryHours = AuthWorkTimeSetting?.SalaryHours || 0;
          }
        } else {
          let flexibleIndex = WorkTimeSetting.findIndex((x) => x.flexible);
          if (flexibleIndex > -1) {
            let { flexible, Options } = WorkTimeSetting[flexibleIndex];
            WorkTimeToday = {
              flexible,
              Options,
              SalaryHours: AuthWorkTimeSetting?.SalaryHours || 0,
            };
          }
        }
      }

      if (
        Brand?.Global?.Admin?.roster &&
        WorkTimeToday?.flexible &&
        AuthWorkTimeSetting?.ShiftName &&
        AuthWorkTimeSetting?.ShiftName.toUpperCase().includes("ROSTER")
      ) {
        WorkTimeToday.Options = WorkOptionsRoster;
      }

      store.dispatch("setWorkTimeSettings", {
        WorkTimeToday,
        WorkTimeSetting,
        WorkShiftsSetting: {
          DI_SOM: WorkShiftsSetting?.DI_SOM || [],
          DI_MUON: WorkShiftsSetting?.DI_MUON || [],
          VE_SOM: WorkShiftsSetting?.VE_SOM || [],
          VE_MUON: WorkShiftsSetting?.VE_MUON || [],
        },
      });
    },
    enabled: Boolean(Auth && Auth?.token && deferredQueriesReady),
  });

  window.refetchWorkTimeSetting = refetchWorkTimeSetting;

  useQuery({
    queryKey: ["Notifications", { ID: Auth?.ID }],
    queryFn: async () => {
      let { data } = await AuthAPI.listNotifications(Auth?.ID, Auth?.token);
      return data?.data || [];
    },
    onSettled: (data) => {
      store.dispatch("setNotifications", data);
    },
    enabled: Boolean(Auth && Auth?.token && deferredQueriesReady),
  });

  const { refetch: refetchProcessings } = useQuery({
    queryKey: ["Processings", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async (a) => {
      let { data } = await AdminAPI.listProcessings({
        StockID: CrStocks?.ID,
        Token: Auth?.token,
      });
      let rs = null;
      if (data?.data) {
        rs = {
          items: [
            {
              Title: "Đặt lịch",
              Index: 1,
              children: [],
              ID: "memberBooks",
            },
            {
              Title: "Huỷ lịch",
              Index: 2,
              children: [],
              ID: "memberBooksCancel",
            },
            {
              Title: "Đơn hàng Online",
              Index: 3,
              children: [],
              ID: "orderWebApp",
            },
            {
              Title: "Duyệt thanh toán",
              Index: 4,
              children: [],
              ID: "smsPayed",
            },
            {
              Title: "Lịch nhắc",
              Index: 5,
              children: [],
              ID: "noti",
            },
            {
              Title: "Liên hệ",
              Index: 6,
              children: [],
              ID: "contact",
            },
            {
              Title: "Thanh toán",
              Index: 7,
              children: [],
              ID: "qrCallback",
            },
          ],
          Count: 0,
        };

        for (const property in data?.data) {
          if (
            [
              "memberBooks",
              "memberBooksCancel",
              "orderWebApp",
              "smsPayed",
              "noti",
              "contact",
              "qrCallback",
            ].includes(property)
          ) {
            if (Array.isArray(data?.data[property])) {
              rs.Count += data?.data[property].length;
            }
            let index = rs.items.findIndex((x) => x.ID === property);
            if (index > -1) {
              rs.items[index].children = data?.data[property];
            }
          }
        }
      }

      return {
        ...rs,
        ...data,
        items: rs?.items
          ? rs.items
              .sort((a, b) => a?.Index - b?.Index)
              .map((x) => ({
                ...x,
                Count: x?.children ? x.children.length : 0,
              }))
              .sort((a, b) => b?.Count - a?.Count)
          : [],
      };
    },
    onSettled: (data) => {
      if (!data?.pending && !data?.data?.pending) {
        store.dispatch("setProcessings", data);
      }
    },
    enabled: Boolean(Auth && Auth?.token),
    initialData: {
      items: [],
      Count: 0,
    },
    refetchInterval: (data) =>
      data?.pending || data?.data?.pending ? 5000 : false,
  });

  var ProcessingsUpdate = (data) => {
    let rs = null;
    if (data) {
      rs = {
        items: [
          {
            Title: "Đặt lịch",
            Index: 1,
            children: [],
            ID: "memberBooks",
          },
          {
            Title: "Huỷ lịch",
            Index: 2,
            children: [],
            ID: "memberBooksCancel",
          },
          {
            Title: "Đơn hàng Online",
            Index: 3,
            children: [],
            ID: "orderWebApp",
          },
          {
            Title: "Duyệt thanh toán",
            Index: 4,
            children: [],
            ID: "smsPayed",
          },
          {
            Title: "Lịch nhắc",
            Index: 5,
            children: [],
            ID: "noti",
          },
          {
            Title: "Liên hệ",
            Index: 6,
            children: [],
            ID: "contact",
          },
          {
            Title: "Thanh toán",
            Index: 7,
            children: [],
            ID: "qrCallback",
          },
        ],
        Count: 0,
      };

      for (const property in data) {
        if (
          [
            "memberBooks",
            "memberBooksCancel",
            "orderWebApp",
            "smsPayed",
            "noti",
            "contact",
            "qrCallback",
          ].includes(property)
        ) {
          if (Array.isArray(data[property])) {
            rs.Count += data[property].length;
          }
          let index = rs.items.findIndex((x) => x.ID === property);
          if (index > -1) {
            rs.items[index].children = data[property];
          }
        }
      }
    }

    let result = {
      ...rs,
      ...data,
      items: rs?.items ? rs.items.sort((a, b) => a?.Index - b?.Index) : [],
    };

    store.dispatch("setProcessings", result);
  };

  window.ProcessingsUpdate = ProcessingsUpdate;

  window.refetchProcessings = refetchProcessings;

  useQuery({
    queryKey: ["InvoiceProcessings", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.invoiceProcessings({
        Token: Auth?.token,
        MemberCheckInID: CrStocks?.ID,
        pi: 1,
        ps: 100,
        StockID: CrStocks?.ID,
      });

      return data?.data
        ? data?.data
            .map((item) => ({
              ...item,
              TimeCheckOut: item?.CheckIn?.CreateDate || null,
            }))
            .sort(function (left, right) {
              return moment
                .utc(left.TimeCheckOut)
                .diff(moment.utc(right.TimeCheckOut));
            })
        : [];
    },
    onSettled: (data) => {
      store.dispatch("setInvoiceProcessings", data);
    },
    enabled: Boolean(Auth && Auth?.token && deferredQueriesReady),
  });

  useQuery({
    queryKey: ["ClientBirthDayCount", { ID: Auth?.ID, StockID: CrStocks?.ID }],
    queryFn: async () => {
      let { data } = await AdminAPI.ClientBirthDayCount({
        Token: Auth?.token,
      });
      let obj = {
        day: 0,
        mon: 0,
      };
      if (data?.stocks && data?.stocks.length > 0) {
        let index = data?.stocks.findIndex((x) => x.StockID === CrStocks?.ID);
        if (index > -1) {
          obj = data?.stocks[index];
        }
      }
      return obj;
    },
    onSettled: (data) => {
      store.dispatch("setClientBirthDayCount", data);
    },
    enabled: Boolean(Auth && Auth?.token && deferredQueriesReady),
  });

  const handleBzReceive = ({ data }) => {
    if (!Auth) return;
    let newData = JSON.parse(data.data);
    if (!newData?.subject) return;

    refetchProcessings();

    if (
      (newData?.body?.MemberID && newData?.subject === "userCheckInOut") ||
      newData?.subject === "member_group"
    ) {
      Promise.all([
        queryClient.invalidateQueries(["ClientManageID"]),
        queryClient.invalidateQueries(["OrderManageID"]),
        queryClient.invalidateQueries(["ServiceUseManageID"]),
        queryClient.invalidateQueries(["InvoiceProcessings"]),
      ]);
    }

    if (Brand?.Global?.PosApp) {
      // if (!notificationFull.current) {
      //   notificationFull.current = f7.notification.create({
      //     titleRightText: "vài giây trước",
      //     title: "Thông báo",
      //     subtitle: "Bạn có 1 cần xử lý mới",
      //     closeTimeout: 5000,
      //     closeOnClick: true,
      //     on: {
      //       click() {
      //         if (window.PathCurrent !== "/admin/processings/") {
      //           f7.views.main.router.navigate("/admin/processings/");
      //         }
      //       },
      //     },
      //   });
      // }
      // notificationFull.current.open();
    }
  };

  useEffect(() => {
    if (Auth?.token) {
      if (!window.bzClient) {
        var gr = String(Brand?.Domain).replace(/https:\/\//g, "");

        var bzClient = new BZ({
          group: gr,
          user: "u_" + Auth?.ID,
          ReceiveMessage: function (sender, data, group) {
            var e = new Event("bz.receive");
            e.data = {
              sender: sender,
              data: data,
            };
            document.dispatchEvent(e);

            try {
              var o = JSON.parse(data); //{to: subject:'', body:{}}
              //console.log(o);
            } catch (e) {
              //
              throw e;
            }
          },
        });
        window.bzClient = bzClient;
        bzClient.start();
      }
    }
  }, [Auth, Brand]);

  useEffect(() => {
    if (Brand && typeof window.appPOS === "undefined") {
      CDNHelpers.addScript(
        Brand.Domain + `/adminz/user.user.top/appPOS.js?${new Date().getTime()}`
      )
        .then(() => {
          appPOS.setDomain(Brand.Domain);
        })
        .catch((err) => console.log(err));
    } else if (!Brand && typeof appPOS !== "undefined") {
      // CDNHelpers.removeScript([
      //   "https://msg.ezs.vn/lib/aspnet/signalr/dist/browser/signalr.js",
      //   "/admincp/Js/datetimepicker/moment.min.js",
      //   "/adminz/user.user.top/POS27.js",
      // ]);
    }

    if (Brand && typeof window.ClientZ === "undefined") {
      window.SERVER = Brand.Domain;
      CDNHelpers.addScript(
        Brand.Domain + `/app2021/service/http-common.js?${new Date().getTime()}`
      ).then(() => {
        // StorageHelpers.remove({
        //   keys: ["clientz"],
        // });
      });
    } else if (!Brand && typeof ClientZ !== "undefined") {
      // StorageHelpers.remove({
      //   keys: ["clientz"],
      // });
      //CDNHelpers.removeScript(["/app2021/service/http-common.js"]);
    }
  }, [Brand?.Domain]);

  useEffect(() => {
    document.addEventListener("bz.receive", handleBzReceive);
    return () => document.removeEventListener("bz.receive", handleBzReceive);
  });

  useEffect(() => {
    if (!database || !Auth) return;

    const adminRef = ref(database, "appcc/");
    let isInitial = true;
    let debounceTimer = null;

    const unsubscribe = onValue(adminRef, (snapshot) => {
      if (!snapshot.exists()) return;

      if (isInitial) {
        isInitial = false;
        return;
      }

      // Debounce: chỉ gọi refetch sau 500ms kể từ thay đổi cuối
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        let rs = snapshot.val();
        const keys = Object.keys(rs);
        const lastKey = keys[keys.length - 1];
        if (rs[lastKey] && rs[lastKey].data && rs[lastKey].data.length > 0) {
          let index = rs[lastKey].data.findIndex((x) => x === Auth?.ID);
          if (index > -1) {
            await refetchAuth();
            await queryClient.invalidateQueries(["TimekeepingHome"]);
            await queryClient.invalidateQueries(["TimekeepingList"]);
          }
        }
      }, 1000);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [database, Auth]);

  let logOutAccount = (callback) => {
    store.dispatch("logoutAuto", () => {
      callback && callback();
      f7.views.main.router.navigate("/login/");
    });
  };

  window.logOutAccount = logOutAccount;

  window.f7 = {
    dialog: f7.dialog,
  };

  return <>{children}</>;
}

export default LayoutProvider;
