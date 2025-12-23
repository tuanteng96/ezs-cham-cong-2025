import React, { useEffect } from "react";
import { Button, Input, Page, f7 } from "framework7-react";
import PromHelpers from "../../helpers/PromHelpers";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "react-query";
import axios from "axios";
import store from "../../js/store";
import KeyboardsHelper from "../../helpers/KeyboardsHelper";
import StorageHelpers from "../../helpers/StorageHelpers";
import AssetsHelpers from "@/helpers/AssetsHelpers";

const schemaDomain = yup
  .object({
    Domain: yup.string().required("Vui lòng nhập tên miền SPA."),
  })
  .required();

const BrandPage = ({ f7router }) => {
  const { control, handleSubmit, setError, setValue } = useForm({
    defaultValues: {
      Domain: "",
    },
    resolver: yupResolver(schemaDomain),
  });

  useEffect(() => {
    StorageHelpers.get({
      keys: ["_historyDomain"],
      success: ({ _historyDomain }) => {
        if (_historyDomain) {
          setValue("Domain", String(_historyDomain).replace(/https:\/\//g, ""));
        }
      },
    });
  }, []);

  const domainMutation = useMutation({
    mutationFn: async (domain) => {
      let { data: rsConfig } = await axios.get(
        `${domain}/api/v3/config?cmd=getnames&names=Bill.Title,logo.mau,App.webnoti&ignore_root=1`
      );
      let { data: Global } = await axios.get(
        `${domain}/brand/global/Global.json`
      );

      return {
        success: rsConfig?.success,
        BrandsInfo: rsConfig?.data || [],
        Global,
      };
    },
  });

  const onSubmit = ({ Domain }) => {
    domainMutation.mutate("https://" + Domain.toLowerCase(), {
      onSuccess: ({ BrandsInfo, Global, success }) => {
        if (success && BrandsInfo) {
          let FirebaseApp = null;
          if (BrandsInfo.filter((x) => x.Name === "App.webnoti").length > 0) {
            let firebaseStr = BrandsInfo.filter(
              (x) => x.Name === "App.webnoti"
            )[0]["ValueText"];

            FirebaseApp = firebaseStr;
          }
          store
            .dispatch("setBrand", {
              Domain: "https://" + Domain.toLowerCase(),
              Name: BrandsInfo.filter((x) => x.Name === "Bill.Title")[0][
                "ValueText"
              ],
              Logo: BrandsInfo.filter((x) => x.Name === "logo.mau")[0]["Src"],
              Firebase: BrandsInfo.filter((x) => x.Name === "App.webnoti")[0][
                "ValueText"
              ],
              FirebaseApp,
              Global,
            })
            .then(() => {
              StorageHelpers.set({
                data: {
                  _historyDomain: "https://" + Domain,
                  _historyU: "",
                  _historyP: "",
                },
              });
              f7router.navigate("/login/");
            });
        } else {
          setError("Domain", {
            type: "Server",
            message: data?.error || "Lỗi không xác định.",
          });
        }
      },
      onError: () => {
        setError("Domain", {
          type: "Server",
          message: "Địa chỉ tên miền SPA không hợp lệ.",
        });
      },
    });
  };

  const onQRCode = () => {
    PromHelpers.OPEN_QRCODE().then(({ data }) => {
      let Domain = data.replace(/^[Optional(\"]+|[\")]+$/g, "");

      f7.dialog.preloader("Đang thực hiện...");

      domainMutation.mutate(Domain.toLowerCase(), {
        onSuccess: ({ BrandsInfo, Stocks, Global, success }) => {
          if (success && BrandsInfo) {
            store
              .dispatch("setBrand", {
                Domain: Domain.toLowerCase(),
                Name: BrandsInfo.filter((x) => x.Name === "Bill.Title")[0][
                  "ValueText"
                ],
                Logo: BrandsInfo.filter((x) => x.Name === "logo.mau")[0]["Src"],
                Stocks,
                Global,
              })
              .then(() => {
                f7.dialog.close();
                f7router.navigate("/login/");
              });
          } else {
            f7.dialog.close();
            f7.dialog.alert(data?.error || "Lỗi không xác định.");
          }
        },
        onError: () => {
          f7.dialog.close();
          f7.dialog.alert("Địa chỉ tên miền SPA không hợp lệ.");
        },
      });
    });
  };

  return (
    <Page
      className="bg-white"
      noNavbar
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR()}
    >
      <div className="flex flex-col justify-between h-full pb-safe-b page-scrollbar">
        <div className="max-w-full overflow-auto grow ">
          <img
            className="object-contain w-full h-full"
            src={AssetsHelpers.toAbsoluteUrlCore(
              "/AppCoreV2/images/brand-icon.jpg",
              ""
            )}
            alt=""
          />
        </div>
        <div className="p-4">
          <div className="mb-5 text-center">
            <div className="mb-1.5 text-xl font-bold">Chọn SPA</div>
            <div className="font-light">
              Nhập tên miền hoặc quét QR Code để chọn cơ sở bạn đang làm việc.
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <Controller
                name="Domain"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    className="[&_input]:rounded [&_input]:placeholder:normal-case"
                    type="text"
                    placeholder="Nhập tên miền SPA ... (Eg: cser.vn)"
                    value={field.value}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    onInput={field.onChange}
                    onFocus={(e) =>
                      KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                    }
                    clearButton={true}
                    onInputClear={() => {
                      StorageHelpers.remove({
                        keys: ["_historyDomain", "_historyP", "_historyU"],
                      });
                    }}
                  />
                )}
              />
            </div>
            <Button
              type="submit"
              className="normal-case bg-app"
              fill
              large
              preloader
              loading={domainMutation.isLoading}
              disabled={domainMutation.isLoading}
            >
              Tiếp tục
            </Button>
          </form>
          <div className="my-4 relative text-center after:content-[''] after:absolute after:w-full after:h-[1px] after:bg-[#f2f2f7] after:left-0 after:top-3">
            <span className="relative z-10 px-4 bg-white text-muted">Or</span>
          </div>
          <Button
            type="button"
            className="normal-case bg-black"
            fill
            large
            preloader
            loading={false}
            onClick={onQRCode}
          >
            QR Code
          </Button>
          <div className="mt-5 text-xs text-center text-muted">
            Bản quyền thuộc về EZS.VN
          </div>
        </div>
      </div>
    </Page>
  );
};

export default BrandPage;
