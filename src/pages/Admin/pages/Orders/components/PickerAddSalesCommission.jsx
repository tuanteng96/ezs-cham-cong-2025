import StringHelpers from "@/helpers/StringHelpers";
import { SelectPicker, SelectPickersGroupBonus } from "@/partials/forms/select";
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
import BonusRose from "./BonusRose";
import BonusSales from "./BonusSales";
import AdminAPI from "@/api/Admin.api";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import ConditionsHelpers from "@/helpers/ConditionsHelpers";
import SelectMembersBouns from "./SelectMembersBouns";
import { NumericFormat } from "react-number-format";
import { RolesHelpers } from "@/helpers/RolesHelpers";
import ArrayHelpers from "@/helpers/ArrayHelpers";

let getOiOrderGlobal = ({ Items, Brand }) => {
  let oiItems = Items || [];
  if (
    Brand?.Global?.Admin?.cai_dat_phi?.visible &&
    Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
  ) {
    if (
      Brand?.Global?.Admin?.cai_dat_phi?.visible &&
      Brand?.Global?.Admin?.cai_dat_phi?.an_tinh_hs_ds
    ) {
      oiItems = oiItems.filter(
        (x) =>
          x.ProdTitle !== Brand?.Global?.Admin?.cai_dat_phi?.TIP?.ProdTitle &&
          x.ProdTitle !==
            Brand?.Global?.Admin?.cai_dat_phi?.PHIDICHVU?.ProdTitle &&
          x.ProdTitle !==
            Brand?.Global?.Admin?.cai_dat_phi?.PHIQUETTHE?.ProdTitle
      );
    }
  }
  return oiItems.map((item) => {
    let obj = {
      ...item,
      label: item.ProdTitle,
      value: item.ID,
    };
    if (item.gia_tri_thanh_toan === "NaN") {
      obj.initialRose = item.prodBonus;
    }
    return obj;
  });
};

const PickerAddSalesCommission = forwardRef(
  ({ children, Order, f7router }, ref) => {
    const queryClient = useQueryClient();

    let Brand = useStore("Brand");
    let Auth = useStore("Auth");
    let CrStocks = useStore("CrStocks");

    const { adminTools_byStock } = RolesHelpers.useRoles({
      nameRoles: ["adminTools_byStock"],
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
        Previews: [],
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

    const { fields: fieldsPreviews } = useFieldArray({
      control,
      name: "Previews",
    });

    useEffect(() => {
      reset({
        Basic: getOiOrderGlobal({ Items: Order?.oiItems || [], Brand }).map(
          (x) => ({
            Product: x,
            Staffs: null,
          })
        ),
      });
      setIsAdvanced(false);
    }, [visible]);

    useEffect(() => {
      if (visible) {
        let OiItems = getOiOrderGlobal({ Items: Order?.oiItems || [], Brand });
        if (OiItems && OiItems.length === 1) {
          //selectRef?.current?.open?.();
        }
      }
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

    const onSubmit = ({ Basic, Advanced }) => {
      if (isAdvanced) {
        onSubmitUpdate({
          Advanced,
        });
      } else {
        console.log(Basic);
        let newPreviews = Basic
          ? Basic.map(({ Product, Staffs }) => ({
              Product,
              Hoa_Hong: Staffs
                ? Staffs.map((x) => ({
                    Product,
                    Staff: x,
                    Value:
                      x?.GroupRose?.value === "KY_THUAT_VIEN"
                        ? Math.round(
                            getValueKTV({ item: Product, user: x }) /
                              Staffs.length
                          )
                        : Math.round(
                            getValueHH({
                              item: Product,
                              user: x,
                              Type: x.GroupRose,
                            }) / Staffs.length
                          ),
                  }))
                : [],
              Doanh_So: Staffs
                ? Staffs.map((x) => ({
                    Product,
                    Staff: x,
                    Value: Math.round(Product.gia_tri_doanh_so / Staffs.length),
                  }))
                : [],
            }))
          : [];
        setValue("Previews", newPreviews);
      }
    };

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
      let { Previews, Advanced } = values;

      let Hoa_Hong = [];
      let Doanh_So = [];
      if (isAdvanced) {
        const newData = Advanced.filter(
          (item) =>
            typeof item === "object" &&
            item.Product?.ID &&
            item.Value &&
            item.Staff?.ID
        );
        Hoa_Hong = newData
          .filter((item) => item.Type.value === "hoa_hong")
          .filter((o) => o.Value !== null);
        Doanh_So = newData
          .filter((item) => item.Type.value === "doanh_so")
          .filter((o) => o.Value !== null);
      } else {
        Hoa_Hong = [].concat.apply(
          [],
          Previews && Previews.length > 0
            ? Previews.map((item) => item.Hoa_Hong)
            : []
        );
        if (Brand?.Global?.Admin?.thuong_ds_theo_loai) {
          Doanh_So = [].concat
            .apply(
              [],
              Previews && Previews.length > 0
                ? Previews.map((item) => item.Doanh_So)
                : []
            )
            .map((x) => ({ ...x, Type: x.Type ? x.Type.value : "" }));
        } else {
          Doanh_So = [].concat.apply(
            [],
            Previews && Previews.length > 0
              ? Previews.map((item) => item.Doanh_So)
              : []
          );
        }
      }

      const dataSubmit = {
        OrderID: Order?.OrderID,
        save: {
          them_hoa_hong: Hoa_Hong.map((item) => ({
            Value: item.Value || 0,
            ReceiverUserID: item.Staff?.ID,
            SubSourceID: item.Product?.ID,
          })).filter((o) => o.Value !== null),
          them_doanh_so: Doanh_So.map((item) => ({
            Value: item.Value || 0,
            ReceiverUserID: item.Staff?.ID,
            OrderItemID: item.Product?.ID,
            KpiType: item.KpiType?.value,
          })).filter((o) => o.Value !== null),
        },
      };

      updateMutation.mutate(
        {
          data: dataSubmit,
          Token: Auth?.token,
          StockID: CrStocks?.ID,
        },
        {
          onSuccess: (data) => {
            f7.dialog.close();
            toast.success("Cập nhật thành công.");
            setValue("Previews", []);
            setVisible(false);
            f7router?.back?.();
          },
        }
      );
    };

    const getValueHH = ({ item, user }) => {
      if (item.gia_tri_thanh_toan === "NaN") {
        if (
          item?.prodBonus?.BonusSaleLevels &&
          item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary) &&
          user?.GroupRose?.value !== "KY_THUAT_VIEN"
        ) {
          let { BonusSaleLevels } = item?.prodBonus;
          let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
          let Salary = 0;
          if (index > -1) {
            Salary = BonusSaleLevels[index].Salary;
          }
          return Salary * item.Qty;
        }
        if (user?.GroupRose?.value !== "KY_THUAT_VIEN") {
          return item.prodBonus.BonusSale * item.Qty;
        }
        return item.prodBonus.BonusSale2 * item.Qty;
      }
      if (
        item?.prodBonus?.BonusSaleLevels &&
        item?.prodBonus?.BonusSaleLevels.some((x) => x.Salary) &&
        user?.GroupRose?.value !== "KY_THUAT_VIEN"
      ) {
        let { BonusSaleLevels } = item?.prodBonus;
        let index = BonusSaleLevels.findIndex((x) => x.Level === user.level);
        let Salary = 0;
        if (index > -1) {
          Salary = BonusSaleLevels[index].Salary;
        }
        if (Salary < 100) {
          return Math.round((item.gia_tri_thanh_toan_thuc_te * Salary) / 100);
        }
        return (
          ((((item.gia_tri_thanh_toan_thuc_te * Salary) / item.ToPay) *
            user.Ratio) /
            100) *
          item.Qty
        );
      }
      return item.prodBonus.BonusSale > 100
        ? item.gia_tri_thanh_toan * item.Qty
        : item.gia_tri_thanh_toan;
    };

    const getValueKTV = ({ item }) => {
      return item.prodBonus.BonusSale2 > 100
        ? Math.round(
            (item.prodBonus.BonusSale2 *
              item.gia_tri_thanh_toan_thuc_te *
              item.Qty) /
              item.ToPay
          )
        : Math.round(
            item.gia_tri_thanh_toan_thuc_te * (item.prodBonus.BonusSale2 / 100)
          );
    };

    let hideForChild = fieldsPreviews && fieldsPreviews.length > 0;

    let oiItems = getOiOrderGlobal({ Items: Order?.oiItems || [], Brand });

    let { Basic, Advanced, Previews } = watch();

    let GroupsByUser = [];

    if (Previews && Previews.length > 0) {
      for (let product of Previews) {
        for (let ds of product?.Doanh_So || []) {
          let indexDs = GroupsByUser.findIndex(
            (x) => x?.Staff?.value === ds?.Staff?.value
          );
          if (indexDs > -1) {
            GroupsByUser[indexDs]["Doanh_So"] = [
              ...(GroupsByUser[indexDs]["Doanh_So"] || []),
              ds,
            ];
          } else {
            GroupsByUser.push({
              Staff: ds?.Staff,
              Doanh_So: [ds],
              Hoa_Hong: [],
            });
          }
        }
        for (let hh of product?.Hoa_Hong || []) {
          let indexHh = GroupsByUser.findIndex(
            (x) => x?.Staff?.value === hh?.Staff?.value
          );
          if (indexHh > -1) {
            GroupsByUser[indexHh]["Hoa_Hong"] = [
              ...(GroupsByUser[indexHh]["Hoa_Hong"] || []),
              hh,
            ];
          } else {
            GroupsByUser.push({
              Staff: product?.Staff,
              Doanh_So: [ds],
              Hoa_Hong: [],
            });
          }
        }
      }

      GroupsByUser = GroupsByUser.map((x) => ({
        ...x,
        Doanh_So: x.Doanh_So ? x.Doanh_So.filter((x) => x.Value) : [],
        Hoa_Hong: x.Hoa_Hong ? x.Hoa_Hong.filter((x) => x.Value) : [],
      })).map((x) => ({
        ...x,
        Sum_Doanh_So: ArrayHelpers.sumTotal(x.Doanh_So, "Value"),
        Sum_Hoa_Hong: ArrayHelpers.sumTotal(x.Hoa_Hong, "Value"),
      }));
    }

    let isHiddenPrice = false;
    if (Brand?.Global?.Admin?.hoa_hong_an_gia) {
      if (!adminTools_byStock?.hasRight) isHiddenPrice = true;
    }

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
                        Tạo hoa hồng / Doanh số
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
                                setValue(
                                  "Basic",
                                  getOiOrderGlobal({
                                    Items: Order?.oiItems || [],
                                    Brand,
                                  }).map((x) => ({
                                    Product: x,
                                    Staffs: null,
                                  }))
                                );
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
                                setValue("Advanced", [
                                  {
                                    Product: null,
                                    Type: {
                                      value: "hoa_hong",
                                      label: "Hoa hồng",
                                    },
                                    Staff: null,
                                    Value: "",
                                  },
                                ]);
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
                                options={Order?.nhan_vien || []}
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
                            Thêm sản phẩm / Nhân viên
                          </button>
                        )}
                      </div>
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
                                      options={Order?.nhan_vien || []}
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
                                    {item?.Product?.ProdTitle}
                                  </div>
                                  {/* <div className="flex gap-1 text-gray-700">
                                  <span>SL :</span>
                                  <span className="font-lato">
                                    {item.Product.Qty}
                                  </span>
                                  <span>*</span>
                                  <span className="font-lato">
                                    {StringHelpers.formatVND(
                                      item.Product.don_gia
                                    )}
                                  </span>
                                  <span>=</span>
                                  <span className="font-lato">
                                    {StringHelpers.formatVND(
                                      item.Product.ToPay
                                    )}
                                  </span>
                                </div> */}
                                </div>
                                <div>
                                  <Controller
                                    name={`Basic[${index}].Staffs`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPickersGroupBonus
                                        isMulti
                                        isClearable
                                        placeholder="Chọn nhân viên"
                                        options={Order?.nhan_vien || []}
                                        label="Chọn nhân viên"
                                        placeholderInput="Nhập tên nhân viên"
                                        onChange={(val) => {
                                          field.onChange(
                                            val
                                              ? val.map((k) => ({
                                                  ...k,
                                                  label: k?.Ratio
                                                    ? `${k.Fn} (${k?.Ratio}%)`
                                                    : k.Fn,
                                                }))
                                              : null
                                          );
                                        }}
                                        value={field.value}
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
                          loading={updateMutation.isLoading}
                          disabled={
                            updateMutation.isLoading ||
                            (isAdvanced
                              ? !(
                                  Advanced &&
                                  Advanced.some((x) => x.Staff && x.Value)
                                )
                              : !(
                                  Basic &&
                                  Basic.some((x) => x?.Staffs?.length > 0)
                                ))
                          }
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
                  onClick={() => setValue("Previews", [])}
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
                      <div
                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                        onClick={() => setValue("Previews", [])}
                      >
                        <XMarkIcon className="w-6" />
                      </div>
                    </div>
                    <div className="px-4 overflow-auto grow">
                      {isPreviewEdit && (
                        <>
                          {fieldsPreviews &&
                            fieldsPreviews.map((item, index) => (
                              <div
                                className="mb-4 border rounded last:mb-0"
                                key={item.id}
                              >
                                <div className="flex gap-3 px-4 py-3.5 border-b bg-warning-light rounded-t">
                                  <div className="flex-1 text-lg font-medium">
                                    {item?.Product?.label}
                                    {/* <div className="mt-1.5 font-lato">
                                    {item.Product.Qty}
                                    <span className="px-1">x</span>
                                    {StringHelpers.formatVND(
                                      item.Product.don_gia
                                    )}
                                    <span className="px-1">=</span>
                                    {StringHelpers.formatVND(
                                      item.Product.ToPay
                                    )}
                                  </div> */}
                                  </div>
                                </div>
                                <div>
                                  <div className="border-b">
                                    <div className="flex items-center px-4 pt-4 font-semibold uppercase">
                                      Hoa hồng
                                    </div>
                                    <BonusRose
                                      name={`Previews[${index}].Hoa_Hong`}
                                      adminTools_byStock={true}
                                    />
                                  </div>
                                  <div>
                                    <div className="px-4 pt-4 font-semibold uppercase">
                                      Doanh số
                                    </div>
                                    <BonusSales
                                      name={`Previews[${index}].Doanh_So`}
                                      adminTools_byStock={true}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </>
                      )}
                      {!isPreviewEdit && (
                        <>
                          {GroupsByUser.map((item, index) => (
                            <div
                              className="mb-4 border rounded last:mb-0"
                              key={index}
                            >
                              <div className="flex gap-3 px-4 py-3.5 border-b bg-gray-50 rounded-t">
                                <div className="font-medium">
                                  {item?.Staff?.Fn || item?.Staff?.label}
                                </div>
                              </div>
                              <div className="border-b">
                                <div className="p-4 border-b last:border-0">
                                  <div className="flex justify-between">
                                    <div className="flex items-center font-medium">
                                      Hoa hồng
                                    </div>
                                    <div className="font-semibold font-lato text-success text-[15px]">
                                      {isHiddenPrice ? (
                                        "******"
                                      ) : (
                                        <>
                                          {StringHelpers.formatVND(
                                            item?.Sum_Hoa_Hong
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {item.Hoa_Hong &&
                                    item.Hoa_Hong.length > 0 && (
                                      <div className="text-gray-500">
                                        {item.Hoa_Hong.map(
                                          (x) => x?.Product?.ProdTitle
                                        ).join(", ")}
                                      </div>
                                    )}
                                </div>

                                <div className="p-4 border-b last:border-0">
                                  <div className="flex justify-between">
                                    <div className="flex items-center font-medium">
                                      Doanh số
                                    </div>
                                    <div className="font-semibold text-[15px] font-lato text-success">
                                      {isHiddenPrice ? (
                                        "******"
                                      ) : (
                                        <>
                                          {StringHelpers.formatVND(
                                            item?.Sum_Doanh_So
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {item.Doanh_So &&
                                    item.Doanh_So.length > 0 && (
                                      <div className="text-gray-500">
                                        {item.Doanh_So.map(
                                          (x) => x?.Product?.ProdTitle
                                        ).join(", ")}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="flex gap-3 p-4">
                      <Button
                        type="button"
                        className="bg-[#E4E6EF] text-gray-700 rounded-full w-[120px]"
                        fill
                        large
                        preloader
                        onClick={() => setIsPreviewEdit(!isPreviewEdit)}
                      >
                        {isPreviewEdit ? "Xem tổng" : "Chi tiết"}
                      </Button>
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

export default PickerAddSalesCommission;
