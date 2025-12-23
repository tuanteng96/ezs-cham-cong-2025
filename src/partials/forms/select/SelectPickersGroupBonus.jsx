import NoFound from "@/components/NoFound";
import KeyboardsHelper from "@/helpers/KeyboardsHelper";
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, useStore } from "framework7-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { NumericFormat } from "react-number-format";
import { SelectPicker } from "..";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";

const PickerEditBonus = ({ children, GroupUsers }) => {
  let Brand = useStore("Brand");

  const [visible, setVisible] = useState(false);

  const { control, watch, reset } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: "Items",
  });

  let open = () => {
    setVisible(true);
  };

  let close = () => {
    setVisible(false);
  };

  let watchItems = watch("Items");

  return (
    <>
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
                  opacity: 1,
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
                <form className="flex flex-col justify-end h-full pb-safe-b">
                  <div className="flex flex-col max-h-[calc(100vh-var(--f7-safe-area-top)-var(--f7-navbar-height))] bg-white rounded-t-[var(--f7-sheet-border-radius)]">
                    <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                      Tỉ lệ thưởng
                      <div
                        className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                        onClick={close}
                      >
                        <XMarkIcon className="w-6" />
                      </div>
                    </div>
                    <div>
                      {fields &&
                        fields.map((item, index) => (
                          <div
                            className={clsx(
                              "relative py-4 pl-4 pr-4 border-b last:border-0"
                            )}
                            key={item.id}
                          >
                            <div className="relative mb-1.5 flex-1 flex justify-between items-center">
                              <div>
                                {item?.Fn || item?.label}
                                {item?.sub && (
                                  <div className="text-gray-400 mt-1 text-[13px]">
                                    {item?.sub}
                                  </div>
                                )}
                              </div>
                              <div
                                onClick={async () => {
                                  if (fields.length <= 1) {
                                    reset({
                                      Items: [],
                                    });
                                    requestAnimationFrame(() => {
                                      close();
                                    });
                                  } else {
                                    let newItems = [...watchItems];
                                    newItems = newItems.filter(
                                      (x) => x.value !== item.value
                                    );
                                    newItems = newItems.map((x) => ({
                                      ...x,
                                      Ratio: +(100 / newItems.length).toFixed(
                                        2
                                      ),
                                    }));
                                    reset({
                                      Items: newItems,
                                    });
                                  }
                                }}
                              >
                                <XCircleIcon className="w-5 text-danger" />
                              </div>
                            </div>
                            <div
                              className={clsx(
                                "grid gap-2",
                                !Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an
                                  ? "grid-cols-3"
                                  : "grid-cols-1"
                              )}
                            >
                              <div>
                                <Controller
                                  name={`Items[${index}].Ratio`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <div className="relative">
                                      <NumericFormat
                                        className={clsx(
                                          "w-full text-[15px] border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                                          1 === 2
                                            ? "border-danger"
                                            : "border-[#d5d7da]"
                                        )}
                                        type="text"
                                        autoComplete="off"
                                        thousandSeparator={false}
                                        placeholder="Tỉ lệ"
                                        value={field.value}
                                        onValueChange={(val) => {
                                          if (val.value === "") {
                                            field.onChange(""); // cho phép xoá trắng
                                            return;
                                          }

                                          field.onChange(val.floatValue);
                                        }}
                                        isAllowed={(values) => {
                                          const { floatValue } = values;
                                          return (
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                              floatValue <= 100)
                                          );
                                        }}
                                        suffix="%"
                                      />
                                    </div>
                                  )}
                                />
                              </div>
                              {!Brand?.Global?.Admin
                                ?.hoa_hong_tu_van_ktv_an && (
                                <div className="col-span-2">
                                  <Controller
                                    name={`Items[${index}].GroupRose`}
                                    control={control}
                                    render={({ field, fieldState }) => (
                                      <SelectPicker
                                        isClearable={false}
                                        placeholder="Nhóm"
                                        value={field.value}
                                        options={GroupUsers}
                                        label="Nhóm nhân viên"
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
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="p-4">
                      <Button
                        type="button"
                        className="flex-1 rounded-full bg-app"
                        fill
                        large
                        preloader
                        onClick={close}
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById("framework7-root")
      )}
    </>
  );
};

const SelectPickersGroupBonus = forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      label,
      placeholder,
      placeholderInput,
      errorMessage,
      errorMessageForce,
      isRequired = true,
      isFilter = false,
      isClearable = true,
      isDisabled = false,
      onInputFilter,
      closes,
      onClose,
    },
    ref
  ) => {
    let Brand = useStore("Brand");

    const [visible, setVisible] = useState(false);
    const [key, setKey] = useState("");
    let [GroupUsers, setGroupUsers] = useState([]);

    useEffect(() => {
      let newGroup = [
        {
          value: "TU_VAN",
          label: Brand?.Global?.Admin?.hoa_hong_tu_van || "Hoa hồng tư vấn",
        },
      ];
      if (!Brand?.Global?.Admin?.hoa_hong_tu_van_ktv_an) {
        newGroup = [
          {
            value: "TU_VAN",
            label: Brand?.Global?.Admin?.hoa_hong_tu_van || "Hoa hồng tư vấn",
          },
          {
            value: "KY_THUAT_VIEN",
            label:
              Brand?.Global?.Admin?.hoa_hong_tu_van_khm ||
              "Hoa hồng tư vấn ( KH mới )",
          },
        ];
      }
      setGroupUsers(newGroup);
    }, [Brand]);

    let methods = useForm({
      defaultValues: {
        Items: [],
      },
    });

    const { control, handleSubmit, setValue, reset, watch } = methods;

    const { fields, remove } = useFieldArray({
      control,
      name: "Items",
    });

    useEffect(() => {
      if (!visible) {
        reset(
          { Items: [] },
          {
            keepValues: false,
            keepDirtyValues: false,
            keepDefaultValues: false,
          }
        );
      } else {
        reset({
          Items: value || [],
        });
      }
    }, [visible]);

    const onSubmit = (values) => {
      onChange(
        values.Items
          ? values.Items.filter((opt) => opt.Ratio && opt.Ratio !== "0").filter(
              (opt, index, self) =>
                index === self.findIndex((o) => o.value === opt.value)
            )
          : []
      );

      close();
    };

    const handleSubmitWithoutPropagation = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(onSubmit)(e);
    };

    let open = () => {
      setVisible(true);
    };

    let close = () => {
      setVisible(false);
      setKey("");
      onInputFilter && onInputFilter("");
      onClose && onClose(value);
    };

    useImperativeHandle(ref, () => ({
      open: () => open(),
      close: () => close(),
      click: () => open(),
    }));

    let watchItems = watch("Items");

    const getSub = (item) => {
      let index = watchItems.findIndex((x) => x.value === item.value);
      if (index === -1 || !watchItems[index].Ratio) return <></>;
      return (
        <div className="text-gray-400 mt-1 text-[13px]">
          Tỉ lệ thưởng {watchItems[index]["Ratio"]}%
        </div>
      );
    };

    return (
      <FormProvider {...methods}>
        <div
          className="relative"
          onClick={() => !isDisabled && open()}
          ref={ref}
        >
          <div
            className={clsx(
              "no-keyboard flex w-full pl-4 pr-24 py-3 border rounded focus:border-primary shadow-input",
              errorMessageForce ? "border-danger" : "border-[#d5d7da]",
              isDisabled && "bg-[#f0f0f0]"
            )}
          >
            <div className="flex flex-wrap gap-2">
              {value &&
                value.map((x, idx) => (
                  <div className="flex bg-gray-100 rounded-sm" key={idx}>
                    <div className="px-1.5 py-px text-[13px]">{x.label}</div>
                    <div
                      className="flex items-center px-1 bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) {
                          onChange(value.filter((o) => x.value !== o.value));
                        }
                      }}
                    >
                      <XMarkIcon className="w-3.5" />
                    </div>
                  </div>
                ))}
            </div>

            {(!value || value.length === 0) && (
              <div className="text-muted">{placeholder}</div>
            )}
            <div className="absolute right-0 flex h-full top-2/4 -translate-y-2/4">
              <div className="flex items-center justify-center w-12 h-full">
                <ChevronDownIcon className="w-5" />
              </div>
              {isClearable &&
                !isDisabled &&
                value &&
                (Array.isArray(value) ? value.length > 0 : value) && (
                  <div
                    className="flex items-center justify-center w-12 h-full relative after:content-[''] after:absolute after:right-0 after:h-4/6 after:w-[1px] after:bg-[#d5d7da] after:left-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange("");
                    }}
                  >
                    <XMarkIcon className="w-5" />
                  </div>
                )}
            </div>
          </div>
        </div>
        {errorMessage && errorMessageForce && (
          <div className="mt-1.5 text-xs text-danger font-light">
            {errorMessage}
          </div>
        )}

        {createPortal(
          <AnimatePresence>
            {visible && (
              <form
                className="fixed z-[125001] inset-0 flex justify-end flex-col"
                onSubmit={handleSubmitWithoutPropagation}
              >
                <motion.div
                  key={visible}
                  className="absolute inset-0 bg-black/[.5] z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                ></motion.div>
                <motion.div
                  className="relative flex flex-col z-20 bg-white rounded-t-[var(--f7-sheet-border-radius)] h-[calc(100%-var(--ezs-safe-area-top)-var(--f7-navbar-height))]"
                  initial={{ opacity: 0, translateY: "100%" }}
                  animate={{ opacity: 1, translateY: "0%" }}
                  exit={{ opacity: 0, translateY: "100%" }}
                >
                  <div className="relative flex justify-center px-4 py-5 text-xl font-semibold text-center">
                    {label}
                    <div
                      className="absolute top-0 right-0 flex items-center justify-center w-12 h-full"
                      onClick={close}
                    >
                      <XMarkIcon className="w-6" />
                    </div>
                  </div>
                  <div className="px-4 mb-4">
                    <div className="relative">
                      <Input
                        className="[&_input]:rounded [&_input]:placeholder:normal-case [&_input]:text-[15px] [&_input]:pl-14"
                        type="text"
                        placeholder={placeholderInput}
                        value={key}
                        clearButton={true}
                        onInput={(e) => {
                          setKey(e.target.value);
                          onInputFilter && onInputFilter(e.target.value);
                        }}
                        onFocus={(e) =>
                          KeyboardsHelper.setAndroid({
                            Type: "body",
                            Event: e,
                          })
                        }
                      />
                      <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4 pointer-events-none">
                        <MagnifyingGlassIcon className="w-6 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <div className={clsx("overflow-auto grow")}>
                    {options &&
                      options.length > 0 &&
                      options.filter(
                        (x) => x.options && x.options.length > 0
                      ) &&
                      options
                        .filter((x) => x.options && x.options.length > 0)
                        .map((group, i) => (
                          <div key={i}>
                            <div className="px-4 uppercase font-medium text-[13px] text-muted my-2">
                              {group.label}
                            </div>
                            <div>
                              {group.options &&
                                group.options.map((item, index) => (
                                  <div
                                    className={clsx(
                                      "relative py-4 pl-4 pr-10 border-b last:border-0",
                                      watchItems
                                        .map((x) => x.value)
                                        .includes(item.value) && "text-primary"
                                    )}
                                    onClick={() => {
                                      let findIndex = watchItems.findIndex(
                                        (x) => x.value === item.value
                                      );
                                      let newItems = [...(watchItems || [])];

                                      if (findIndex > -1) {
                                        newItems = newItems.filter(
                                          (x) => x.value !== item.value
                                        );
                                      } else {
                                        newItems.push({
                                          ...item,
                                          GroupRose: null,
                                          Ratio: "",
                                        });
                                      }
                                      reset({
                                        Items: newItems.map((x) => ({
                                          ...x,
                                          GroupRose:
                                            x?.GroupRose || GroupUsers[0],
                                          Ratio: +(
                                            100 / newItems.length
                                          ).toFixed(2),
                                        })),
                                      });
                                    }}
                                    key={index}
                                  >
                                    {item?.label}
                                    {getSub(item)}

                                    <CheckIcon
                                      className={clsx(
                                        "absolute w-6 top-2/4 right-4 -translate-y-2/4",
                                        watchItems
                                          .map((x) => x.value)
                                          .includes(item.value)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}

                    {(!options ||
                      options.length === 0 ||
                      (options &&
                        options.filter((x) => x.options && x.options.length > 0)
                          .length === 0)) && (
                      <div>
                        <NoFound
                          Title="Không có kết quả nào."
                          Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pb-safe-b">
                    <div className="flex gap-3 p-4">
                      {watchItems.length > 0 && (
                        <PickerEditBonus GroupUsers={GroupUsers}>
                          {({ open }) => (
                            <Button
                              onClick={open}
                              type="button"
                              className="rounded-full bg-[#E4E6EF] text-gray-700 w-[150px]"
                              fill
                              large
                              preloader
                            >
                              Chi tiết ({watchItems.length})
                            </Button>
                          )}
                        </PickerEditBonus>
                      )}

                      <Button
                        type="submit"
                        className="flex-1 rounded-full bg-app"
                        fill
                        large
                        preloader
                      >
                        Xác nhận
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </form>
            )}
          </AnimatePresence>,
          document.getElementById("framework7-root")
        )}
      </FormProvider>
    );
  }
);

export default SelectPickersGroupBonus;
