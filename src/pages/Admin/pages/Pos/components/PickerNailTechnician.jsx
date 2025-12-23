import StringHelpers from "@/helpers/StringHelpers";
import {
  SelectMembersServices,
  SelectPicker,
  SelectPickersGroupBonus,
} from "@/partials/forms/select";
import {
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, f7, useStore } from "framework7-react";
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import {
  Controller,
  useFieldArray,
  useForm,
  FormProvider,
} from "react-hook-form";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import ConditionsHelpers from "@/helpers/ConditionsHelpers";
import { NumericFormat } from "react-number-format";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import ArrayHelpers from "@/helpers/ArrayHelpers";

const PickerNailTechnician = forwardRef(
  ({ children, f7router, Frees, Os }, ref) => {
    const queryClient = useQueryClient();
    // console.log(Frees);
    // console.log(Os);
    let Brand = useStore("Brand");
    let Auth = useStore("Auth");
    let CrStocks = useStore("CrStocks");

    const { adminTools_byStock, pos_mng } = RolesHelpers.useRoles({
      nameRoles: ["adminTools_byStock", "pos_mng"],
      auth: Auth,
      CrStocks,
    });

    const [visible, setVisible] = useState(false);
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [isPreviewEdit, setIsPreviewEdit] = useState(false);

    const selectRef = useRef(null);

    const methods = useForm({
      defaultValues: {
        Basic: [], // Theo cài đặt
        Advanced: [], // Nâng cao
      },
    });

    const { control, handleSubmit, setValue, reset, watch } = methods;

    const { fields: fieldsBasic } = useFieldArray({
      control,
      name: "Basic",
    });

    const {
      fields: fieldsAdvanced,
      append: appendAdvanced,
      remove: removeAdvanced,
    } = useFieldArray({
      control,
      name: "Advanced",
    });

    const OsItem = useQuery({
      queryKey: ["OsNailDetailID", { ID: Os?.ID }],
      queryFn: async () => {
        let rs = await appPOS.getOs({
          mid: Os?.MemberID,
          osid: Os?.ID,
        });

        let ContextJSONApi = null;
        if (pos27) {
          let svh = pos27.member(Os?.MemberID).service();
          if (svh.getProd) {
            var root = svh.getProd(rs.ProdServiceID);

            if (root.ContextJSON && JSON.parse(root.ContextJSON)?.IsNail) {
              ContextJSONApi = {
                ContextJSON: rs?.ContextJSON
                  ? JSON.parse(rs?.ContextJSON)
                  : null,
              };

              if (svh) {
                let arr = await svh?.getContextSalaryItem(rs);
                ContextJSONApi.SalaryItems = arr;
              }
            }
          }
        }

        let Status = rs?.Status;
        if (
          Brand?.Global?.Admin?.Pos_quan_ly?.giao_ca_thao_tac ===
          "Hoàn thành ca"
        ) {
          if (!Status) {
            Status = "doing";
          }
        }

        return rs
          ? { ...rs, ContextJSONApi, Status, rsStatus: rs?.Status }
          : null;
      },
      onSuccess: (data) => {
        let Fees = [];
        let ProdsTitleNail = Brand?.Global?.Admin?.ProdsNail || [];

        if (data.feeList && data?.feeList?.length > 0) {
          let newFee = data.feeList.filter((x) => x.Remain > 0 || x.Assign > 0);
          if (newFee.length > 0) {
            let isNail = newFee.some(
              (x) =>
                ProdsTitleNail.findIndex((k) =>
                  k.IDFees.map((o) => Number(o)).includes(x.TypeID)
                ) > -1
            );

            if (isNail) {
              for (let fe of newFee) {
                for (let prod of ProdsTitleNail) {
                  let IDFees = prod.IDFees.map((x) => Number(x));
                  let index = IDFees.findIndex((x) => x === fe.TypeID);
                  if (index > -1) {
                    let typeIndex = Fees.findIndex((x) => x.ID === fe.TypeID);
                    if (typeIndex > -1) {
                      Fees[typeIndex].feeList = [
                        ...(Fees[typeIndex].feeList || []),
                        fe,
                      ];
                    } else {
                      Fees.push({
                        ID: fe.TypeID,
                        Title: fe.TypeTitle,
                        feeList: [fe],
                        Staffs: null,
                        Fees: newFee,
                      });
                    }
                  }
                }
              }
            }
          }
        }

        reset({
          Basic: Fees,
          Advanced: [],
        });
      },
      enabled: visible,
    });

    useEffect(() => {
      setIsAdvanced(false);
    }, [visible]);

    let open = () => {
      setVisible(true);
    };

    let close = () => {
      setVisible(false);
    };

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    const handleSubmitWithoutPropagation = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(onSubmit)(e);
    };

    const onSubmit = () => {};

    const handleSubmitUpdate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(onSubmitUpdate)(e);
    };

    const updateMutation = useMutation({
      mutationFn: async (body) => {
        let data = await AdminAPI.clientsViewOrderChangeBonusId(body);
        await Promise.all([
          queryClient.invalidateQueries(["ClientOrderViewID"]),
          queryClient.invalidateQueries(["ClientOrderBonusViewID"]),
        ]);
        return data;
      },
    });

    const onSubmitUpdate = (values) => {
      f7.dialog.preloader("Đang thực hiện ...");
    };

    let hideForChild = false;

    let { Basic, Advanced } = watch();

    return (
      <FormProvider {...methods}>
        {children({ open, close })}

        {createPortal(
          <AnimatePresence initial={false}>
            {visible && (
              <motion.div
                key="sheet-visible"
                className="fixed z-[125001] inset-0 flex justify-end flex-col"
              >
                <motion.div
                  className="absolute inset-0 bg-black/[.5] z-10"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: hideForChild ? 0 : 1,
                  }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                />
                <motion.div
                  key="sheet"
                  className="relative z-20"
                  initial={{ opacity: 0, translateY: "100%" }}
                  animate={{ opacity: 1, translateY: "0%" }}
                  exit={{ opacity: 0, translateY: "100%" }}
                >
                  <form
                    className={clsx(
                      "flex flex-col justify-end h-full pb-safe-b transition-opacity duration-300",
                      hideForChild
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                    )}
                    onSubmit={handleSubmitWithoutPropagation}
                  >
                    <motion.div
                      animate={{
                        opacity: hideForChild ? 0 : 1,
                        y: hideForChild ? 10 : 0,
                      }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col h-[calc(100vh-var(--f7-safe-area-top)-var(--f7-navbar-height))] bg-[var(--f7-page-bg-color)] rounded-t-[var(--f7-sheet-border-radius)]"
                    >
                      <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                        Nhân viên thực hiện
                        <div
                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                          onClick={close}
                        >
                          <XMarkIcon className="w-6" />
                        </div>
                      </div>

                      <div className="px-4 pb-3.5">
                        <div className="flex items-end justify-between px-4 py-4 bg-white rounded-lg">
                          <div className="text-gray-500 uppercase font-medium text-[13px]">
                            Loại
                          </div>
                          <div className="flex gap-4">
                            <div
                              className="flex items-center gap-2"
                              onClick={() => {
                                setValue("Basic", null);
                                setIsAdvanced(false);
                              }}
                            >
                              <div
                                className={clsx(
                                  "bg-[#EBEDF3] w-4 h-4 rounded-full border-[5px] transition-all",
                                  !isAdvanced
                                    ? "border-primary"
                                    : "border-[#EBEDF3]"
                                )}
                              ></div>
                              <div
                                className={clsx(
                                  "uppercase font-medium text-[13px] transition-colors leading-3 pt-px",
                                  !isAdvanced ? "text-primary" : "text-gray-500"
                                )}
                              >
                                Mặc định
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={() => {
                                setValue("Advanced", null);
                                setIsAdvanced(true);
                              }}
                            >
                              <div
                                className={clsx(
                                  "bg-[#EBEDF3] w-4 h-4 rounded-full border-[5px] transition-all",
                                  isAdvanced
                                    ? "border-primary"
                                    : "border-[#EBEDF3]"
                                )}
                              ></div>
                              <div
                                className={clsx(
                                  "uppercase font-medium text-[13px] leading-3 transition-colors pt-px",
                                  isAdvanced ? "text-primary" : "text-gray-500"
                                )}
                              >
                                Nâng cao
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 mb-3.5 empty:hidden">
                        {!isAdvanced && (
                          <>
                            <button
                              disabled={isAdvanced}
                              type="button"
                              className="flex items-center justify-center h-12 gap-2 text-center text-white rounded-lg bg-primary disabled:opacity-40"
                              onClick={() => selectRef?.current?.open()}
                            >
                              <UserPlusIcon className="w-5" />
                              Chọn nhanh nhân viên
                            </button>
                            <div className="hidden">
                              <SelectPickersGroupBonus
                                ref={selectRef}
                                isMulti
                                isClearable
                                placeholder="Chọn nhân viên"
                                options={[]}
                                label="Chọn nhân viên"
                                placeholderInput="Nhập tên nhân viên"
                                onChange={(val) => {
                                  if (val) {
                                    let newOiItems = Order?.oiItems || [];

                                    reset({
                                      Basic: newOiItems.map((x) => ({
                                        Product: x,
                                        Staffs: val.map((k) => ({
                                          ...k,
                                          label: k?.Ratio
                                            ? `${k.label} (${k?.Ratio}%)`
                                            : k.label,
                                        })),
                                      })),
                                    });

                                    setTimeout(() => {
                                      handleSubmit(onSubmit)();
                                    }, 0);
                                  }
                                }}
                                value={null}
                              />
                            </div>
                          </>
                        )}
                        {isAdvanced && (
                          <button
                            type="button"
                            className="flex items-center justify-center h-12 gap-2 text-center text-white rounded-lg bg-primary disabled:opacity-40"
                            onClick={() =>
                              appendAdvanced({
                                Product: null,
                                Type: {
                                  value: "hoa_hong",
                                  label: "Hoa hồng",
                                },
                                Staff: null,
                                Value: "",
                              })
                            }
                          >
                            Chọn nhân viên
                          </button>
                        )}
                      </div>
                      {OsItem?.isLoading && (
                        <div className="flex items-center justify-center grow">
                          <div role="status">
                            <svg
                              aria-hidden="true"
                              className="w-8 h-8 text-gray-200 animate-spin fill-primary"
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
                      <div className="px-4 overflow-auto grow">
                        {isAdvanced &&
                          fieldsAdvanced.map((item, index) => (
                            <div
                              className="p-4 bg-white rounded-lg mb-3.5 last:mb-0"
                              key={item.id}
                            >
                              <div className="flex gap-2 mb-3 last:mb-0">
                                <div className="flex-1">
                                  <Controller
                                    name={`Advanced[${index}].Product`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        isClearable={false}
                                        placeholder="Chọn sản phẩm"
                                        value={field.value}
                                        options={oiItems}
                                        label="Chọn sản phẩm"
                                        onChange={(val) => {
                                          field.onChange(val);
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                        autoHeight
                                      />
                                    )}
                                  />
                                </div>
                                {fieldsAdvanced.length > 1 && (
                                  <button
                                    className="w-auto px-3 text-danger bg-danger-light py-2.5 rounded"
                                    type="button"
                                    onClick={() =>
                                      f7.dialog.confirm("Xác nhận xoá ? ", () =>
                                        removeAdvanced(index)
                                      )
                                    }
                                  >
                                    <TrashIcon className="w-5" />
                                  </button>
                                )}
                              </div>
                              <div className="mb-3 last:mb-0">
                                <Controller
                                  name={`Advanced[${index}].Type`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <SelectPicker
                                      isClearable={false}
                                      placeholder="Chọn loại"
                                      value={field.value}
                                      options={[
                                        {
                                          value: "hoa_hong",
                                          label: "Hoa hồng",
                                        },
                                        {
                                          value: "doanh_so",
                                          label: "Doanh số",
                                        },
                                      ]}
                                      label="Chọn loại"
                                      onChange={(val) => {
                                        field.onChange(val);
                                      }}
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                      autoHeight
                                    />
                                  )}
                                />
                              </div>
                              {Advanced[index]?.Type?.value === "doanh_so" &&
                                Brand?.Global?.Admin?.thuong_ds_theo_loai && (
                                  <div className="mb-3 last:mb-0">
                                    <Controller
                                      name={`Advanced[${index}].KpiType`}
                                      control={control}
                                      render={({ field, fieldState }) => (
                                        <SelectPicker
                                          isDisabled={ConditionsHelpers.isDisabledSalesSommission(
                                            item,
                                            Brand?.Global?.Admin
                                              ?.thuong_ds_nang_cao,
                                            adminTools_byStock.hasRight
                                          )}
                                          isClearable={true}
                                          placeholder="Chọn loại"
                                          value={field.value}
                                          options={Array.from(
                                            { length: 10 },
                                            (_, i) => i + 1
                                          ).map((x) => ({
                                            label: "Loại " + x,
                                            value: x,
                                          }))}
                                          label="Chọn loại"
                                          onChange={(val) =>
                                            field.onChange(val)
                                          }
                                          errorMessage={
                                            fieldState?.error?.message
                                          }
                                          errorMessageForce={
                                            fieldState?.invalid
                                          }
                                        />
                                      )}
                                    />
                                  </div>
                                )}
                              <div className="mb-3 last:mb-0">
                                <Controller
                                  name={`Advanced[${index}].Staff`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <SelectMembersBouns
                                      isClearable
                                      placeholder="Chọn nhân viên"
                                      value={field.value}
                                      options={[]}
                                      label="Chọn nhân viên"
                                      onChange={(option) => {
                                        field.onChange(option);
                                      }}
                                      errorMessage={fieldState?.error?.message}
                                      errorMessageForce={fieldState?.invalid}
                                    />
                                  )}
                                />
                              </div>
                              <div className="mb-3 last:mb-0">
                                <Controller
                                  name={`Advanced[${index}].Value`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <div className="relative">
                                      <NumericFormat
                                        className={clsx(
                                          "w-full input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                          fieldState?.invalid
                                            ? "border-danger"
                                            : "border-[#d5d7da]"
                                        )}
                                        type="text"
                                        autoComplete="off"
                                        thousandSeparator={true}
                                        placeholder="Nhập số tiền"
                                        value={field.value}
                                        onValueChange={(val) =>
                                          field.onChange(val.floatValue || "")
                                        }
                                        disabled={ConditionsHelpers.isDisabledSalesSommission(
                                          item,
                                          Brand?.Global?.Admin
                                            ?.thuong_ds_nang_cao,
                                          adminTools_byStock.hasRight
                                        )}
                                      />
                                      {field.value ? (
                                        <div
                                          className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                                          onClick={() => field.onChange("")}
                                        >
                                          <XMarkIcon className="w-5" />
                                        </div>
                                      ) : (
                                        <></>
                                      )}
                                    </div>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        {!isAdvanced && (
                          <>
                            {fieldsBasic.map((item, index) => (
                              <div
                                className="p-4 bg-white rounded-lg mb-3.5 last:mb-0"
                                key={item.id}
                              >
                                <div className="mb-2.5">
                                  <div className="mb-px font-medium">
                                    {item?.Title}
                                  </div>
                                </div>
                                <div>
                                  <Controller
                                    name={`Basic[${index}].Staffs`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectMembersServices
                                        ShiftOnly={true}
                                        isMulti
                                        isRequired={false}
                                        placeholderInput="Tên nhân viên"
                                        placeholder="Chọn nhân viên"
                                        value={field.value}
                                        label="Chọn nhân viên"
                                        onChange={(val) => {
                                          if (
                                            Brand?.Global?.Admin
                                              ?.so_luong_nv_buoi_dv
                                          ) {
                                            if (
                                              field.value &&
                                              field.value.length >=
                                                Brand?.Global?.Admin
                                                  ?.so_luong_nv_buoi_dv
                                            ) {
                                              toast.error(
                                                `Chỉ có thể chọn tối đa ${Brand?.Global?.Admin?.so_luong_nv_buoi_dv} nhân viên.`
                                              );
                                              return;
                                            }
                                          }

                                          if (appPOS) {
                                            appPOS
                                              .setOs(
                                                {
                                                  ...OsItem?.data,
                                                },
                                                {
                                                  action: "TINH_LUONG_NAIL",
                                                  data: {
                                                    Staffs: val
                                                      ? val.map((m) => ({
                                                          UserID: m?.value,
                                                          FullName: m?.label,
                                                          Value: 0,
                                                          feeList: item.feeList
                                                            ? item.feeList.map(
                                                                (x) => ({
                                                                  ...x,
                                                                  Assign:
                                                                    x?.Remain,
                                                                })
                                                              )
                                                            : [],
                                                        }))
                                                      : [],
                                                  },
                                                }
                                              )
                                              .then((os) => {
                                                console.log(os)
                                                field.onChange(
                                                  os?.Staffs?.map((x) => ({
                                                    ...x,
                                                    label: x.FullName,
                                                    value: x.UserID,
                                                    Value: x.Salary || x.Value,
                                                    raw: x.Salary || x.Value,
                                                    feeList: x.feeList
                                                      ? x.feeList.map((f) => ({
                                                          ...f,
                                                          raw: f.Value,
                                                        }))
                                                      : [],
                                                  }))
                                                );
                                              })
                                              .catch((e) => console.log(e));
                                          }
                                        }}
                                        errorMessage={
                                          fieldState?.error?.message
                                        }
                                        errorMessageForce={fieldState?.invalid}
                                        isFilter
                                        StockRoles={pos_mng?.StockRoles}
                                        actions={
                                          OsItem?.data?.Status === "done"
                                            ? null
                                            : [
                                                {
                                                  Title: "Xác nhận",
                                                  className:
                                                    "bg-app rounded-full",
                                                  onClick: (close) => close(),
                                                },
                                              ]
                                        }
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="p-4">
                        <Button
                          type="submit"
                          className="flex-1 rounded-full bg-app"
                          fill
                          large
                          preloader
                          loading={OsItem.isLoading}
                          disabled={OsItem.isLoading}
                        >
                          {isAdvanced ? "Thêm mới" : "Tiếp tục"}
                        </Button>
                      </div>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            )}
            {hideForChild && (
              <motion.div
                key="sheet-previews"
                className="fixed z-[125001] inset-0 flex justify-end flex-col"
              >
                <motion.div
                  className="absolute inset-0 bg-black/[.5] z-10"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                />
                <motion.div
                  key="sheet"
                  className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] max-h-[90%]"
                  initial={{ opacity: 0, translateY: "100%" }}
                  animate={{ opacity: 1, translateY: "0%" }}
                  exit={{ opacity: 0, translateY: "100%" }}
                >
                  <form
                    className="flex flex-col h-full pb-safe-b"
                    onSubmit={handleSubmitUpdate}
                  >
                    <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                      Hoa hồng / Doanh số
                      <div className="absolute top-0 right-0 flex items-center justify-center w-12 h-full">
                        <XMarkIcon className="w-6" />
                      </div>
                    </div>
                    <div className="px-4 overflow-auto grow"></div>
                    <div className="p-4">
                      <Button
                        type="submit"
                        className="flex-1 rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={updateMutation.isLoading}
                        disabled={updateMutation.isLoading}
                      >
                        Thêm mới
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.getElementById("framework7-root")
        )}
      </FormProvider>
    );
  }
);

export default PickerNailTechnician;
