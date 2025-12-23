import { f7 } from "framework7-react";

import BrandPage from "../pages/Brand/index.jsx";
import LoginPage from "../pages/Login/index.jsx";



import HomePage from "../pages/Home/index.jsx";

const resolveComponent = (loader) => async function ({ resolve }) {
  const { default: Component } = await loader();
  resolve({ component: Component });
};
















var routes = [
  {
    path: "/",
    redirect: ({ resolve }) => {
      if (!f7.store.state.Brand && !f7.store.state.Auth) {
        resolve({
          url: "/brand/",
        });
      } else if (f7.store.state.Brand && !f7.store.state.Auth) {
        resolve({
          url: "/login/",
        });
      } else {
        resolve({
          url: "/home/",
        });
      }
    },
  },
  {
    path: "/home/",
    component: HomePage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/brand/",
    component: BrandPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/login/",
    component: LoginPage,
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/timekeeping/",
    async: resolveComponent(() => import("../pages/Timekeeping/index.jsx")),
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/take-break/",
    async: resolveComponent(() => import("../pages/TakeBreak/index.jsx")),
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/report/",
    //component: ReportPage,
    async: async function ({ router, to, resolve, direction }) {
      const app = router.app;
      if (
        direction !== "backward" &&
        to?.url === "/report/" &&
        !app.__reportPreloader
      ) {
        app.__reportPreloader = app.dialog.preloader("Đang tải báo cáo...");
        app.__reportPreloader.on("closed", () => {
          app.__reportPreloader = null;
        });
      }
      resolve({ component: (await import("../pages/Report/index.jsx")).default });
    },
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/report-preview/",
    //component: ReportPage,
    async: async function ({ router, to, resolve, direction }) {
      const app = router.app;
      if (
        direction !== "backward" &&
        to?.url === "/report-preview/" &&
        !app.__reportPreloader
      ) {
        app.__reportPreloader = app.dialog.preloader("Đang tải báo cáo...");
        app.__reportPreloader.on("closed", () => {
          app.__reportPreloader = null;
        });
      }
      resolve({ component: (await import("../pages/Report/ReportPreview.jsx")).default });
    },
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "/notifications/",
    async: resolveComponent(() => import("../pages/Notifications/index.jsx")),
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "view/:id/",
        //component: NotificationDetailPage,
        async: async function ({ router, to, resolve }) {
          // App instance
          var app = router.app;
          app.dialog.preloader("Đang tải...");

          resolve({
            component: (await import("../pages/Notifications/NotificationDetail.jsx"))
              .default,
          });
        },
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/admin/",
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "inventory/",
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "warehouse/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Inventory/pages/Warehouse/index.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "stock-by-branch/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Inventory/pages/StockByBranch/index.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "import-export/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Inventory/pages/ImportExport/index.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "supplier/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Inventory/pages/Supplier/index.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "warehouse-pending/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Inventory/pages/WarehousePending/index.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "cash",
    async: resolveComponent(() => import("@/pages/Admin/pages/Cash/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "processings/",
    async: resolveComponent(() => import("../pages/Admin/pages/Processings/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "notifications/",
    async: resolveComponent(() => import("../pages/Admin/pages/Notifications/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "add/",
    async: resolveComponent(() => import("../pages/Admin/pages/Notifications/Add.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "edit/:id/",
    async: resolveComponent(() => import("../pages/Admin/pages/Notifications/Edit.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "utility/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Utility/PrinterIPSettings.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "printerip-setting/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Utility/PrinterIPSettings.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "minigame/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Utility/MiniGameSettings.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "article/:parentid",
    async: resolveComponent(() => import("../pages/Admin/pages/Article/index.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "article/:parentid/:id/",
        //component: ArticleAddAdminPage,
        options: {
          transition: "f7-cover-v",
        },
        async: async function ({ router, to, resolve }) {
          var app = router.app;
          var isAddMode = to.params.id === "add";
          if (!isAddMode) {
            app.dialog.preloader("Đang tải ...");
          }
          resolve({
            component: (await import("../pages/Admin/pages/Article/Add.jsx"))
              .default,
          });
        },
      },
      {
        path: "pos/calendar",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "locks",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosLocksCalendar.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "rooms",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosRoomsCalendar.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "staffs-order",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosStaffsOrderCalendar.jsx")),
            options: {
              transition: "f7-cover",
            },
          },

          {
            path: "care-schedule",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosCareSchedule.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "class-schedule",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClassSchedule.jsx")),
            options: {
              transition: "f7-cover",
            },
            routes: [
              {
                path: "students",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClassStudentSchedule.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
              {
                path: "report",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClassReportSchedule.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
              {
                path: "request",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClassRequestSchedule.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
              {
                path: ":ID",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClassOsSchedule.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
            ],
          },
          {
            path: "setting",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosSettingsCalendar.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "add",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/AddEditCalendar.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "os",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/EditOsCalendar.jsx")),
            options: {
              transition: "f7-cover-v",
            },
            routes: [
              {
                path: "materials/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/EditOsMaterials.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
            ],
          },
        ],
      },
      {
        path: "pos/clients",
    async: resolveComponent(() => import("@/pages/Admin/pages/Clients/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "birthday",
    async: resolveComponent(() => import("@/pages/Admin/pages/Clients/ClientBirthDay.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: ":id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Clients/AddEditClients.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "edit/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Clients/AddEditClients.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
        ],
      },
      {
        path: "pos/orders",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/view/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderView.jsx")),
            options: {
              transition: "f7-cover",
            },
            routes: [
              {
                path: "/bonus-sales-commission",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderBonusSalesCommission.jsx")),
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/bonus-sales-commission-auto",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderBonusSalesCommissionAuto.jsx")),
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/bonus-sales-commission-sharing",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderBonusSalesCommissionSharing.jsx")),
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/split-payments",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderSplitPayments.jsx")),
                options: {
                  transition: "f7-cover-v",
                },
              },
              {
                path: "/return",
    async: resolveComponent(() => import("@/pages/Admin/pages/Orders/OrderReturn.jsx")),
                options: {
                  transition: "f7-cover",
                },
              },
            ],
          },
        ],
      },
      {
        path: "pos/invoice-processings",
    async: resolveComponent(() => import("@/pages/Admin/pages/InvoiceProcessings/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "pos/new-invoice",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosInvoiceNew.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [],
      },
      {
        path: "pos/manage/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientManage.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/diary",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientDiary.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/services",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientServices.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/books",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientBooks.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/wallet",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientWallet.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/debt",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientDebt.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/card",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientCard.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/points",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientPoints.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/order",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientOrder.jsx")),
            options: {
              transition: "f7-cover",
            },
          },

          {
            path: "/create-old-card",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosCreateOldCard.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/add-prods",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosAddProd.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "/info-client",
    async: resolveComponent(() => import("@/pages/Admin/pages/Pos/PosClientInfoClient.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
        ],
      },
      {
        path: "printers/",
        routes: [
          {
            path: "/order/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Printers/PrinterOrder.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/service/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Printers/PrinterService.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "timekeepings/",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "/shift",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsShift.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/wifi-location",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsWifiLocaiton.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/monthly",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsMonthly.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/take-break",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsTake.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/work",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsWork.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/punishment",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsPunishment.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: "/:MemberID",
    async: resolveComponent(() => import("@/pages/Admin/pages/Timekeepings/TimekeepingsUser.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
        ],
      },
      {
        path: "members",
    async: resolveComponent(() => import("@/pages/Admin/pages/Members/index.jsx")),
        options: {
          transition: "f7-cover",
        },
        routes: [
          {
            path: "add",
    async: resolveComponent(() => import("@/pages/Admin/pages/Members/AddEdit.jsx")),
            options: {
              transition: "f7-cover",
            },
          },
          {
            path: ":id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Members/AddEdit.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
          {
            path: "edit/:id",
    async: resolveComponent(() => import("@/pages/Admin/pages/Clients/AddEditClients.jsx")),
            options: {
              transition: "f7-cover-v",
            },
          },
        ],
      },
    ],
  },
  {
    path: "/account/",
    async: resolveComponent(() => import("../pages/Account/index.jsx")),
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "change-password/",
    async: resolveComponent(() => import("../pages/Account/ChangePassword.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/courses/",
    async: resolveComponent(() => import("../pages/Courses/index.jsx")),
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "attendance/:id",
    async: resolveComponent(() => import("../pages/Courses/Attendance.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "student/:id",
    async: resolveComponent(() => import("../pages/Courses/Student.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/osclass/",
    async: resolveComponent(() => import("@/pages/OsClass/index.jsx")),
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: ":id",
    async: resolveComponent(() => import("@/pages/OsClass/OsClassView.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/technicians/",
    async: resolveComponent(() => import("../pages/Technicians/index.jsx")),
    options: {
      transition: "f7-cover",
    },

    routes: [
      {
        path: "profile/:memberid/:id/",
    async: resolveComponent(() => import("../pages/Technicians/TechniciansProfile.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "service/:memberid/:id/:itemid",
    async: resolveComponent(() => import("../pages/Technicians/TechniciansService.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
      {
        path: "history/:memberid/",
    async: resolveComponent(() => import("../pages/Technicians/TechniciansHistory.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/statistical/",
    async: resolveComponent(() => import("../pages/Statistical/index.jsx")),
    options: {
      transition: "f7-cover",
    },
    routes: [
      {
        path: "day",
    async: resolveComponent(() => import("@/pages/Statistical/StatisticalDay.jsx")),
        options: {
          transition: "f7-cover",
        },
      },
    ],
  },
  {
    path: "/stocks/",
    async: resolveComponent(() => import("../pages/Stocks/index.jsx")),
    options: {
      transition: "f7-cover",
    },
  },
  {
    path: "(.*)",
    async: resolveComponent(() => import("../pages/404.jsx")),
  },
];

export default routes;
