import { Button, Input, Sheet, f7, useStore } from "framework7-react";
import React, { useEffect, useState } from "react";
import { SelectPicker } from "../partials/forms";
import KeyboardsHelper from "../helpers/KeyboardsHelper";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "react-query";
import WorkTrackAPI from "../api/WorkTrack.api";
import store from "@/js/store";
import AlertHelpers from "@/helpers/AlertHelpers";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useFirebase } from "@/hooks";
import WorksHelpers from "@/helpers/WorksHelpers";

const schemaConfirm = yup
  .object({
    Info: yup.object({
      Type: yup.object().required("Vui lòng chọn loại."),
      Desc: yup
        .string()
        //.required("Vui lòng nhập mô tả.")
        .when(["Type"], {
          is: (Type) => {
            return Type?.value === "CONG_TY";
          },
          then: (schema) => schema.required("Vui lòng nhập mô tả."),
        }),
    }),
  })
  .required();

let options = [
  {
    label: "Việc cá nhân",
    value: "CA_NHAN",
  },
  {
    label: "Việc công ty",
    value: "CONG_TY",
  },
];

function PickerConfirm({ children }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: {},
    resolver: yupResolver(schemaConfirm),
  });
  const [visible, setVisible] = useState(false);

  const [portalRoot, setPortalRoot] = useState(null);

  const Auth = useStore("Auth");
  const CrStocks = useStore("CrStocks");
  const FirebaseApp = useStore("FirebaseApp");

  const firebase = useFirebase(FirebaseApp);

  const database = firebase?.db;

  useEffect(() => {
    const el = document.getElementById("framework7-root");
    setPortalRoot(el);
  }, []);

  const confirmMutation = useMutation({
    mutationFn: async (body) => {
      try {
        let { data } = await WorkTrackAPI.CheckInOut(body);
        if (!data?.list || data?.list?.length === 0) {
          await store.dispatch("setCrsInOut", body.list[0]);
        }

        await Promise.all([
          queryClient.invalidateQueries(["Auth"]),
          queryClient.invalidateQueries(["TimekeepingHome"]),
          queryClient.invalidateQueries(["TimekeepingList"]),
        ]);
        return data ? { ...data, body: body.list[0] } : { body: body.list[0] };
      } catch (error) {
        await store.dispatch("setCrsInOut", body.list[0]);
        throw { body: body.list[0] };
      }
    },
    onSettled: () => {
      if (FirebaseApp) {
        WorksHelpers.addAdminRecord({ database, CrStocks, Auth });
      } else {
        console.log("Firebase chưa được kết nối.");
      }
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang chấm công...");
    let newValues = { ...values };

    delete newValues.Info.Title;
    if (
      newValues.Info["DI_MUON"] &&
      newValues?.Info?.Type?.value === "CONG_TY"
    ) {
      newValues.Info["DI_MUON"] = {
        ...newValues.Info["DI_MUON"],
        Value: 0,
      };
    }
    if (
      newValues.Info["VE_SOM"] &&
      newValues?.Info?.Type?.value === "CONG_TY"
    ) {
      newValues.Info["VE_SOM"] = {
        ...newValues.Info["VE_SOM"],
        Value: 0,
      };
    }
    if (
      newValues.Info["DI_SOM"] &&
      newValues?.Info?.Type?.value === "CA_NHAN"
    ) {
      newValues.Info["DI_SOM"] = {
        ...newValues.Info["DI_SOM"],
        Value: 0,
      };
    }
    if (
      newValues.Info["VE_MUON"] &&
      newValues?.Info?.Type?.value === "CA_NHAN"
    ) {
      newValues.Info["VE_MUON"] = {
        ...newValues.Info["VE_MUON"],
        Value: 0,
      };
    }

    if (
      newValues.Info["DI_MUON"] &&
      newValues?.Info?.Type?.value === "CA_NHAN" &&
      typeof newValues.Info["DI_MUON"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["DI_MUON"].WorkDays;
    }

    if (
      newValues.Info["VE_SOM"] &&
      newValues?.Info?.Type?.value === "CA_NHAN" &&
      typeof newValues.Info["VE_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_SOM"].WorkDays;
    }

    if (
      newValues.Info["DI_SOM"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["DI_SOM"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["DI_SOM"].WorkDays;
    }

    if (
      newValues.Info["VE_MUON"] &&
      newValues?.Info?.Type?.value === "CONG_TY" &&
      typeof newValues.Info["VE_MUON"].WorkDays !== "undefined"
    ) {
      newValues.Info.WorkToday.Value = newValues.Info["VE_MUON"].WorkDays;
    }

    let dataConfirm = {
      list: [
        {
          ...newValues,
          Info: {
            ...newValues?.Info,
            Type: newValues?.Info?.Type?.value || "",
          },
        },
      ],
    };

    confirmMutation.mutate(dataConfirm, {
      onSuccess: (data) => {
        setVisible(false);
        AlertHelpers.CheckInOut({
          data,
          dataCheckInOut: dataConfirm,
        });
      },
      onError: (error) => {
        setVisible(false);
        AlertHelpers.CheckInOut({
          data: error,
          dataCheckInOut: dataConfirm,
        });
      },
    });
  };

  const close = () => {
    reset();
    setVisible(false);
  };

  if (!portalRoot)
    return (
      <div className="relative">
        <div className="absolute w-16 h-16 p-1 rotate-45 bg-white border border-b-0 border-r-0 rounded-full -top-4 left-2/4 -translate-x-2/4 icon-in-out">
          <div className="flex flex-col items-center justify-center w-full h-full transition -rotate-45 rounded-full shadow-3xl">
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-6 text-gray-200 animate-spin fill-primary"
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
        </div>
      </div>
    );

  return (
    <>
      {children({
        open: (initialValues) => {
          setVisible(true);
          if (initialValues) {
            reset({
              ...initialValues,
              Info: {
                ...initialValues?.Info,
                Type: options[0],
                Desc: "",
              },
            });
          }
        },
        close,
      })}

      {createPortal(
        <AnimatePresence>
          {visible && (
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />

              {/* Sheet content */}
              <motion.div
                key="sheet"
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="p-4 my-2">
                  <div className="text-xl font-medium">
                    {watch()?.Info?.Title}
                  </div>
                  <div className="mt-1 font-light">
                    Hãy thông báo cho chúng tôi biết lý do để đảm bảo quyền lợi
                    của bạn.
                  </div>
                </div>

                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Lý do</div>
                      <Controller
                        name="Info.Type"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPicker
                            placeholder="Chọn loại"
                            value={field.value}
                            options={options}
                            label="Chọn loại"
                            onChange={(val) => field.onChange(val)}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Mô tả</div>
                      <Controller
                        name="Info.Desc"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[150px]"
                            type="textarea"
                            placeholder="Nhập mô tả lý do"
                            rows="5"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onChange={field.onChange}
                            onFocus={(e) =>
                              KeyboardsHelper.setAndroid({
                                Type: "modal",
                                Event: e,
                              })
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={confirmMutation.isLoading}
                      disabled={confirmMutation.isLoading}
                    >
                      Cập nhật
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
}

export default PickerConfirm;
