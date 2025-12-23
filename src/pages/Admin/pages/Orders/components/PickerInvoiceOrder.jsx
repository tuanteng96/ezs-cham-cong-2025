import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, f7, useStore } from "framework7-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import clsx from "clsx";

const schemaAdd = yup
  .object({
    CompanyName: yup.string().required("Vui lòng nhập tên công ty."),
    CompanyAddress: yup.string().required("Vui lòng nhập địa chỉ."),
    CompanyTaxCode: yup.string().required("Vui lòng nhập mã số thuế."),
    CompanyEmail: yup.string().required("Vui lòng nhập Email."),
  })
  .required();

function PickerInvoiceOrder({ children, Order }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);

  let Auth = useStore("Auth");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      CompanyName: "",
      CompanyAddress: "",
      CompanyTaxCode: "",
      CompanyEmail: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["InvoiceOrderID", { ID: Order?.Order?.ID }],
    queryFn: async () => {
      let rs = await AdminAPI.getInvoiceOrderID({
        data: {
          OrderID: Order?.Order?.ID,
        },
        Token: Auth?.token,
      });

      return rs?.data;
    },
    onSuccess: (rs) => {
      if (rs?.InvoiceInfo) {
        reset(rs?.InvoiceInfo);
      }
    },
    enabled: visible,
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  const addMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.updateInvoiceOrderID(body);
      await queryClient.invalidateQueries(["OrderManageID"]);
      return data;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    addMutation.mutate(
      {
        data: {
          OrderID: Order?.Order?.ID,
          InvoiceInfo: values,
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          f7.dialog.close();
          toast.success("Cập nhật thành công.");
          reset({
            CompanyName: "",
            CompanyAddress: "",
            CompanyTaxCode: "",
            CompanyEmail: "",
          });
          close();
        },
      }
    );
  };

  const onReset = () => {
    f7.dialog.preloader("Đang thực hiện ...");
    addMutation.mutate(
      {
        data: {
          OrderID: Order?.Order?.ID,
          InvoiceInfo: null,
        },
        Token: Auth?.token,
      },
      {
        onSuccess: ({ data }) => {
          f7.dialog.close();
          toast.success("Cập nhật thành công.");
          reset({
            CompanyName: "",
            CompanyAddress: "",
            CompanyTaxCode: "",
            CompanyEmail: "",
          });
          close();
        },
      }
    );
  };
  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)(e);
  };

  var hasInitialData =
    data?.InvoiceInfo &&
    Object.values(data?.InvoiceInfo).some((v) => v && v.trim() !== "");

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
                className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[calc(100%-var(--f7-navbar-height))]"
                initial={{ opacity: 0, translateY: "100%" }}
                animate={{ opacity: 1, translateY: "0%" }}
                exit={{ opacity: 0, translateY: "100%" }}
              >
                <form
                  className="flex flex-col h-full pb-safe-b"
                  onSubmit={handleSubmitWithoutPropagation}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    Thông tin hoá đơn công ty
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="relative px-4 overflow-auto grow">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Tên công ty</div>
                      <Controller
                        name="CompanyName"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Nhập tên công ty"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Địa chỉ</div>
                      <Controller
                        name="CompanyAddress"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Địa chỉ"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Mã số thuế</div>
                      <Controller
                        name="CompanyTaxCode"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Nhập mã số thuế"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px">Email nhận</div>
                      <Controller
                        name="CompanyEmail"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <Input
                            clearButton
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Nhập Email"
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div
                      role="status"
                      className={clsx(
                        "absolute left-0 top-0 flex items-center justify-center w-full transition h-full z-10 bg-white/50",
                        !isLoading && "hidden"
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
                  <div className="flex gap-3.5 p-4">
                    {hasInitialData && (
                      <Button
                        onClick={onReset}
                        type="button"
                        className="flex-1 bg-[#E4E6EF] text-[#3F4254] rounded-full"
                        fill
                        large
                        preloader
                      >
                        HĐ cá nhân
                      </Button>
                    )}

                    <Button
                      type="submit"
                      className="flex-1 rounded-full bg-app"
                      fill
                      large
                      preloader
                      loading={addMutation.isLoading}
                      disabled={addMutation.isLoading}
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

export default PickerInvoiceOrder;
