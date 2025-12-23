import React, { useEffect, useRef } from "react";
import PromHelpers from "@/helpers/PromHelpers";
import {
  Button,
  f7,
  Link,
  Navbar,
  NavLeft,
  NavTitle,
  Page,
  useStore,
} from "framework7-react";
import { ChevronLeftIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "react-query";
import AdminAPI from "@/api/Admin.api";
import ConfigsAPI from "@/api/Configs.api";
import moment from "moment";
import * as htmlToImage from "html-to-image";
import MoresAPI from "@/api/Mores.api";

var pIndex = 0;

function PrinterService({ f7route }) {
  const Auth = useStore("Auth");
  const Brand = useStore("Brand");

  let Mode = f7route?.query?.mode || "";

  const CrStocks = useStore("CrStocks");

  const ServiceRef = useRef(null);

  const actionsIPToPopover = useRef(null);
  const IpToPopoverWrapper = useRef(null);

  const actionsToPopover = useRef(null);
  const buttonToPopoverWrapper = useRef(null);

  useEffect(() => {
    return () => {
      if (actionsToPopover.current) {
        actionsToPopover.current.destroy();
      }
      if (actionsIPToPopover.current) {
        actionsIPToPopover.current.destroy();
      }
    };
  });

  const { data, isLoading } = useQuery({
    queryKey: ["SizePrinters"],
    queryFn: async () => {
      let data = await GetPrinter();
      return data
        ? data.filter(
            (x) =>
              x.Type === "Service" && x.Checked && x.Path.indexOf("A5") === -1
          )
        : null;
    },
  });

  const PrintersIP = useQuery({
    queryKey: ["PrintersIP", { CrStocks }],
    queryFn: async () => {
      let { data } = await ConfigsAPI.getValue(`ipprinter`);
      let rs = null;
      if (data && data.data && data.data.length > 0) {
        let JSONString = data.data[0].Value;
        if (JSONString) {
          let JSONparse = JSON.parse(JSONString);
          let index = JSONparse?.findIndex((x) => x.StockID === CrStocks?.ID);
          if (index > -1) {
            rs = JSONparse[index].Printers;
          }
        }
      }
      return rs;
    },
  });

  const Service = useQuery({
    queryKey: ["ServicePrinter", { ID: f7route?.params?.id }],
    queryFn: async () => {
      let data = await AdminAPI.getPrinterServiceId({
        OsID: f7route?.params?.id,
        Token: Auth?.token,
        ModeCard: Mode,
      });
      let configs = await ConfigsAPI.getValue(
        "MA_QRCODE_NGAN_HANG,Bill.Title,Bill.Footer"
      );

      let obj = {
        BillTitle: "",
        BillFooter: "",
        ma_nhan_dien: "",
        ngan_hang: "",
      };
      if (configs?.data?.data && configs?.data?.data.length > 0) {
        obj.BillTitle = configs?.data?.data[0]?.Value || "";
        obj.BillFooter = configs?.data?.data[1]?.Value || "";
      }

      if (Brand?.Global?.Admin?.PrintToStockID && data?.data?.os?.StockID) {
        let index = Auth?.Info?.StocksAll.findIndex(
          (x) => x.ID === data?.data?.os?.StockID
        );

        if (index > -1) {
          obj.BillTitle = Auth?.Info?.StocksAll[index].Title;
          if (Auth?.Info?.StocksAll[index].LinkSEO) {
            obj.BillPhone = Auth?.Info?.StocksAll[index].LinkSEO;
          }
          if (Auth?.Info?.StocksAll[index].Desc) {
            obj.BillAddress = Auth?.Info?.StocksAll[index].Desc;
          }
        }
      }
      return data?.data
        ? {
            ...data?.data,
            SysConfig: obj,
          }
        : null;
    },
    enabled: Number(f7route?.params?.id) > 0,
  });

  let onActionIP = () =>
    new Promise((resolve, reject) => {
      let actions = [
        {
          text: "Máy in thực hiện",
          label: true,
        },
      ];
      for (let p of PrintersIP?.data) {
        actions.push({
          text: p.Name,
          onClick: (action, e) => {
            resolve(p);
          },
        });
      }
      actions.push({
        text: "Đóng",
        color: "red",
      });
      if (!actionsIPToPopover.current) {
        actionsIPToPopover.current = f7.actions.create({
          buttons: actions,
          targetEl:
            IpToPopoverWrapper.current.querySelector(".button-ip-print"),
        });
      }
      actionsIPToPopover.current.open();
    });

  let onActionSize = ({ IPAdress }) => {
    if (!data || !data.length === 0) {
      f7.dialog.alert("Bạn chưa cài đặt mẫu in.");
      return;
    }
    if (data && data.length === 1) {
      onConnectPrinter({
        ...data[0],
        IPAdress,
      });
      return;
    }
    let actions = [];
    for (let print of data) {
      actions.push({
        text: print.Title,
        onClick: (action, e) => {
          onConnectPrinter({
            ...print,
            IPAdress,
          });
        },
        close: true,
      });
    }
    actions.push({
      text: "Đóng",
      color: "red",
    });
    if (!actionsToPopover.current) {
      actionsToPopover.current = f7.actions.create({
        buttons: actions,
        targetEl:
          buttonToPopoverWrapper.current.querySelector(".button-to-print"),
      });
    }
    actionsToPopover.current.open();
  };

  const onConnectPrinter = async (print) => {
    f7.dialog.preloader("Đang thực hiện ...");

    let refCurrent = ServiceRef?.current;

    let isSize57 = false;
    let sizeCanvas = 576;

    if (print.Path.indexOf("printOrderDHSize57") > -1) {
      sizeCanvas = 384;
      isSize57 = true;
    }

    const canvas = await htmlToImage.toCanvas(refCurrent, {
      canvasWidth: sizeCanvas,
      canvasHeight:
        (sizeCanvas * refCurrent?.clientHeight) / refCurrent?.clientWidth,
      pixelRatio: 2,
      cacheBust: false,
    });
    const imageBase64 = canvas.toDataURL("image/png");

    var p = {
      ipAddress: print?.IPAdress || "192.168.100.251",
      param: {
        feedLine: true,
        cutHalfAndFeed: window.PlatformId === "ANDROID" ? 1 : 5,
        cutPaper: true,
        items: [
          {
            port: 9100,
            paperWidth: sizeCanvas,
            //imageUrl: AssetsHelpers.toAbsoluteUrl(rs?.data?.src),
            base64: imageBase64.replaceAll("data:image/png;base64,", ""),
            alignment: 1,
            width: 600 || 0,
            model: 0,
          },
        ],
      },
    };

    PromHelpers.PRINTER(p)
      .then((r) => {
        f7.dialog.close();
      })
      .catch((e) => {
        if (pIndex === 0) {
          pIndex = 1;
          f7.dialog.close();
          onConnectPrinter(print);
        } else {
          f7.dialog.close();
          f7.dialog.alert("Không thể kết nối máy in.");
        }
      });
  };

  const onPrinter = () => {
    if (PrintersIP?.data && PrintersIP?.data.length > 1) {
      onActionIP().then((ip) => {
        onActionSize({ IPAdress: ip.IpAddress });
      });
    } else {
      onActionSize({
        IPAdress:
          PrintersIP?.data && PrintersIP?.data.length > 0
            ? PrintersIP?.data[0].IpAddress
            : null,
      });
    }
  };

  const onShare = async () => {
    f7.dialog.preloader("Đang thực hiện ...");

    let refCurrent = ServiceRef?.current;
    const cloneWrapper = document.createElement("div");
    cloneWrapper.style.position = "fixed";
    cloneWrapper.style.left = "-100000px";
    cloneWrapper.style.top = "0";
    cloneWrapper.style.width = `${refCurrent?.clientWidth || 0}px`;
    cloneWrapper.style.pointerEvents = "none";
    cloneWrapper.style.opacity = "0";
    const refClone = refCurrent?.cloneNode(true);
    if (refClone) {
      refClone.classList.add("p-4");
      cloneWrapper.appendChild(refClone);
      document.body.appendChild(cloneWrapper);
    }
    let sizeCanvas = 384;

    const targetNode = refClone || refCurrent;
    const canvas = await htmlToImage.toCanvas(targetNode, {
      canvasWidth: sizeCanvas,
      canvasHeight:
        (sizeCanvas * targetNode?.clientHeight) / targetNode?.clientWidth,
      pixelRatio: 2,
      cacheBust: false,
    });
    const imageBase64 = canvas.toDataURL("image/png");

    var bodyFormData = new FormData();
    bodyFormData.append(
      "title",
      `Hoa-don-dich-vu-${Service?.data?.os?.ID}-${moment(
        Service?.data?.os?.BookDate
      ).format("HH:mm_DD-MM-YYYY")}`
    );
    bodyFormData.append("base64", imageBase64);

    let rs = await MoresAPI.base64toImage({
      data: bodyFormData,
      Token: Auth?.token,
    });

    if (cloneWrapper.parentNode) {
      cloneWrapper.parentNode.removeChild(cloneWrapper);
    }

    f7.dialog.close();
    
    PromHelpers.SHARE_SOCIAL(
      JSON.stringify({
        Images: [AssetsHelpers.toAbsoluteUrl(rs?.data?.src)],
        Content: `Hoá đơn dịch vụ - ${Service?.data?.os?.ID} (${moment(
          Service?.data?.os?.BookDate
        ).format("HH:mm DD/MM/YYYY")})`,
      })
    );
  };

  return (
    <Page
      className="!bg-white"
      name="Service-Printer"
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>
          {Mode ? "Thẻ dịch vụ" : "Phiếu dịch vụ"} #{f7route?.params?.id}
        </NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="flex flex-col h-full pb-safe-b">
        {(isLoading || Service?.isLoading) && (
          <div className="flex items-center justify-center p-4 grow">
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-100 animate-spin fill-primary"
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
        )}

        {!isLoading && !Service?.isLoading && (
          <div className="p-4 overflow-auto grow">
            <div className="bg-white" ref={ServiceRef}>
              <div className="text-center">
                <div className="mb-px font-bold uppercase">
                  {Service?.data?.BillTitle ||
                    Service?.data?.SysConfig?.BillTitle}
                </div>
                {Service?.data?.SysConfig?.BillPhone ||
                Service?.data?.SysConfig?.BillAddress ? (
                  <div>
                    <div>
                      {Service?.data?.SysConfig?.BillAddress || "Chưa có"}
                    </div>
                    <div>
                      Hotline:{" "}
                      {Service?.data?.SysConfig?.BillPhone || "Chưa có"}
                    </div>
                  </div>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: Service?.data?.BillAddress,
                    }}
                  ></div>
                )}
                <h1 className="mt-2 font-bold uppercase">Phiếu dịch vụ</h1>
                <div>
                  <p>
                    #<span className="order-id">{Service?.data?.os?.ID}</span>
                    <span className="px-1.5">-</span>
                    {Service?.data?.os?.BookDate
                      ? moment(Service?.data?.os?.BookDate).format(
                          "HH:mm DD/MM/YYYY"
                        )
                      : "Chưa thực hiện"}
                  </p>
                </div>
              </div>
              <div>
                <div className="mt-4 mb-3">
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div className="w-[150px]">Khách hàng:</div>
                    <div className="flex-1 font-bold text-right capitalize">
                      {Service?.data?.mem?.FullName}
                    </div>
                  </div>
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div className="w-[150px]">Số điện thoại:</div>
                    <div className="flex-1 font-bold text-right">
                      {Service?.data?.mem?.MobilePhone}
                    </div>
                  </div>
                  <div className="flex justify-between mb-1 last:mb-0">
                    <div className="w-[150px]">Địa chỉ:</div>
                    <div className="flex-1 font-bold text-right">
                      {Service?.data?.mem?.HomeAddress}
                    </div>
                  </div>
                  {!Mode &&
                    Service?.data?.staffs &&
                    Service?.data?.staffs.length > 0 && (
                      <div className="flex justify-between mb-1 resources last:mb-0">
                        <div className="w-[150px]">Nhân viên thực hiện:</div>
                        <div className="flex-1 font-bold text-right resources-name">
                          {Service?.data?.staffs
                            .map((x) => x.FullName)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                </div>
                <table className="w-full border border-collapse border-black text-mini print:break-inside-auto">
                  <thead>
                    <tr className="print:break-inside-avoid print:break-after-auto">
                      <th className="border border-black px-1.5 py-2 text-left">
                        Tên dịch vụ
                      </th>
                      <th className="border border-black px-1.5 py-2 text-right w-[100px]">
                        Buổi / Tổng
                      </th>
                    </tr>
                  </thead>

                  {Mode && (
                    <tbody>
                      {Service?.data?.sums &&
                        Service?.data?.sums.map((item, index) => (
                          <tr
                            className="print:break-inside-avoid print:break-after-auto item-prod"
                            key={index}
                          >
                            <td className="border border-black px-1.5 py-2">
                              <div>{item.RootTitleWithType}</div>
                              <div>{item.CardTitle}</div>
                              <div>{item?.Os?.Desc}</div>
                              <div>
                                {item?.Os?.Status != "done"
                                  ? "Chưa làm"
                                  : moment(item.Os.BookDate).format(
                                      "HH:mm DD/MM/YYYY"
                                    )}
                              </div>
                            </td>

                            <td className="border border-black px-1.5 py-2 font-semibold text-right">
                              {item.Index} / {item.Total}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  )}
                  {!Mode && (
                    <tbody>
                      <tr className="print:break-inside-avoid print:break-after-auto item-prod">
                        <td className="border border-black px-1.5 py-2">
                          <div>{Service?.data?.sum?.RootTitleWithType}</div>
                          <div>{Service?.data?.sum?.CardTitle}</div>
                          {/* <div>{Service?.data?.sum?.Os?.Desc}</div>
                                      <div>
                                        {Service?.data?.sum?.Os?.Status != "done"
                                          ? "Chưa làm"
                                          : moment(
                                              Service?.data?.sum?.Os.BookDate
                                            ).format("HH:mm DD/MM/YYYY")}
                                      </div> */}
                        </td>
                        <td className="border border-black px-1.5 py-2 font-semibold text-right">
                          {Service?.data?.sum?.Index} /{" "}
                          {Service?.data?.sum?.Total}
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
                {!Mode && (
                  <div className="my-2">Ghi chú: {Service?.data?.os?.Desc}</div>
                )}

                <div className="mt-2 text-center">
                  <div className="mb-1 font-bold">
                    {Service?.data?.SysConfig?.BillFooter}
                  </div>
                  <div className="italic">
                    Thời gian in : {moment().format("HH:mm DD/MM/YYYY")}
                  </div>
                </div>
              </div>
              <div className="h-20"></div>
            </div>
          </div>
        )}

        <div className="hidden" ref={IpToPopoverWrapper}>
          <div className="button-ip-print"></div>
        </div>
        <div className="hidden" ref={buttonToPopoverWrapper}>
          <div className="button-to-print"></div>
        </div>
        {/* <div className="p-4 bg-white border-t">
          <Button
            type="button"
            className="flex-1 bg-primary"
            fill
            large
            preloader
            loading={isLoading || PrintersIP?.isLoading || Service.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Service.isLoading}
            onClick={onPrinter}
          >
            In hoá đơn
          </Button>
        </div> */}
        <div className="flex gap-3 p-4 bg-white border-t">
          <Button
            style={{ "--f7-preloader-color": "#000" }}
            type="button"
            className="bg-white w-[50px] text-black border border-[#d3d3d3] button button-fill button-large button-preloader"
            fill
            large
            preloader
            onClick={onShare}
            loading={isLoading || PrintersIP?.isLoading || Service.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Service.isLoading}
          >
            <ShareIcon className="w-6" />
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary"
            fill
            large
            preloader
            loading={isLoading || PrintersIP?.isLoading || Service.isLoading}
            disabled={isLoading || PrintersIP?.isLoading || Service.isLoading}
            onClick={onPrinter}
          >
            In hoá đơn
          </Button>
        </div>
      </div>
    </Page>
  );
}

export default PrinterService;
