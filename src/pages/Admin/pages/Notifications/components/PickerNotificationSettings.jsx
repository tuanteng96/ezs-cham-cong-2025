import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { DatePicker, SelectPickersGroup } from "@/partials/forms";
import NotificationsAPI from "@/api/Notifications.api";
import { useQuery } from "react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schemaConfirm = yup
  .object({
    ToMembers: yup.array().nullable(),
    ToUsers: yup.array().nullable(),
    IsSchedule: yup.boolean(),
    NotiDate: yup.mixed().nullable(),
  })
  .test(
    "at-least-one",
    "Vui lòng chọn ít nhất khách hàng hoặc nhân viên",
    function (value) {
      const { ToMembers, ToUsers } = value;
      if (
        (!ToMembers || ToMembers.length === 0) &&
        (!ToUsers || ToUsers.length === 0)
      ) {
        return this.createError({
          path: "ToMembers",
          message: "Cần chọn khách hàng hoặc nhân viên",
        });
      }
      return true;
    }
  )
  .test("mirror-error", null, function (value) {
    const { ToMembers, ToUsers } = value;
    if (
      (!ToMembers || ToMembers.length === 0) &&
      (!ToUsers || ToUsers.length === 0)
    ) {
      this.createError({
        path: "ToUsers",
        message: "Cần chọn khách hàng hoặc nhân viên",
      });
    }
    return true;
  });

function PickerNotificationSettings({
  children,
  onChange,
  onClose,
  onOpen,
  initialValues,
}) {
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      IsSchedule: false,
      NotiDate: null,
      ToMembers: [],
      ToUsers: [],
    },
    resolver: yupResolver(schemaConfirm),
  });

  useEffect(() => {
    if (visible) {
      reset({
        IsSchedule: initialValues?.IsSchedule || false,
        NotiDate: initialValues?.NotiDate || null,
        ToMembers: initialValues?.ToMembers || [],
        ToUsers: initialValues?.ToUsers || [],
      });
    }
  }, [visible]);

  let Members = useQuery({
    queryKey: ["MembersNotifications"],
    queryFn: async () => {
      const { data } = await NotificationsAPI.getMembersSend();
      let newData = [];
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            newData[index].options.push({
              label: text === "TAT_CA" ? "Tất cả" : text,
              value: id,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = group;
            newItem.groupid = groupid;
            newItem.options = [
              {
                label: text === "TAT_CA" ? "Tất cả khách hàng" : text,
                value: id,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }
      return newData;
    },
  });

  let Users = useQuery({
    queryKey: ["UsersNotifications"],
    queryFn: async () => {
      const { data } = await NotificationsAPI.getUsersSend();
      let newData = [];
      if (data?.data) {
        for (let key of data?.data) {
          const { group, groupid, text, id } = key;
          const index = newData.findIndex((item) => item.groupid === groupid);
          if (index > -1) {
            newData[index].options.push({
              label: text === "TAT_CA" ? "Tất cả" : text,
              value: id,
              ...key,
            });
          } else {
            const newItem = {};
            newItem.label = group === "TAT_CA" ? "Tất cả" : text;
            newItem.groupid = groupid;
            newItem.options = [
              {
                label: text === "TAT_CA" ? "Tất cả nhân viên" : text,
                value: id,
                ...key,
              },
            ];
            newData.push(newItem);
          }
        }
      }
      return newData;
    },
  });

  let open = () => {
    setVisible(true);
    onOpen?.();
  };

  let close = () => {
    setVisible(false);
    onClose?.();
  };

  const onSubmit = (values) => {
    onChange(values, { close });
  };

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  let watchForm = watch();

  return (
    <>
      {children({ open, close })}
      {createPortal(
        <AnimatePresence initial={false}>
          {visible && (
            <div className="fixed z-[125001] inset-0 flex justify-end flex-col">
              <motion.div
                key={visible}
                className="absolute inset-0 bg-black/[.5] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              ></motion.div>
              <motion.div
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <div className="relative px-4 py-5 text-xl font-semibold text-center">
                  Cấu hình nâng cao
                  <div
                    className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                    onClick={close}
                  >
                    <XMarkIcon className="w-6" />
                  </div>
                </div>
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="px-4 overflow-auto grow">
                    <div className="mb-4">
                      <div className="mb-px font-light">Khách hàng</div>
                      <Controller
                        name="ToMembers"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPickersGroup
                            isRequired={false}
                            placeholder="Chọn khách hàng"
                            value={field.value}
                            options={Members?.data || []}
                            label="Chọn khách hàng"
                            onChange={(val) => {
                              field.onChange(val ? [val] : []);
                              //trigger("ToUsers");
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="mb-px font-light">Nhân viên</div>
                      <Controller
                        name="ToUsers"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SelectPickersGroup
                            isRequired={false}
                            placeholder="Chọn nhân viên"
                            value={field.value}
                            options={Users?.data || []}
                            label="Chọn nhân viên"
                            onChange={(val) => {
                              field.onChange(val ? [val] : []);
                              //trigger("ToMembers");
                            }}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <div>Hẹn thời gian gửi</div>
                        <Controller
                          name="IsSchedule"
                          control={control}
                          render={({
                            field: { ref, ...field },
                            fieldState,
                          }) => (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                {...field}
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                            </label>
                          )}
                        />
                      </div>
                      <div>
                        {watchForm.IsSchedule && (
                          <Controller
                            name="NotiDate"
                            control={control}
                            render={({
                              field: { ref, ...field },
                              fieldState,
                            }) => (
                              <DatePicker
                                format="HH:mm DD-MM-YYYY"
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Chọn thời gian"
                                showHeader
                              />
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      type="submit"
                      className="rounded-full bg-app"
                      fill
                      large
                      preloader
                    >
                      Thực hiện gửi
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

export default PickerNotificationSettings;
