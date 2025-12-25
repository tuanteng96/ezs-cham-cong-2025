import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import { toast } from "react-toastify";
import ArticleAPI from "@/api/Article.api";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";
import { Disclosure } from "@/partials/components";
import { DatePicker } from "@/partials/forms";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import moment from "moment";
import { Fancybox } from "@fancyapps/ui";
import AssetsHelpers from "@/helpers/AssetsHelpers";

const schemaUpdate = yup.object({
  Titles: yup.object({
    Title: yup.string().required("Vui lòng nhập Title"),
    Title1: yup.string().required("Vui lòng nhập Title1"),
    Title2: yup.string().required("Vui lòng nhập Title2"),
  }),
  options: yup.object({
    color: yup.string().required("color là bắt buộc"),
    ExpiredDate: yup
      .mixed()
      .test(
        "is-not-empty",
        "ExpiredDate không được để trống",
        (value) => value !== "" && value !== null && value !== undefined
      )
      .required("ExpiredDate là bắt buộc"),
    data: yup
      .array()
      .of(
        yup.object({
          option: yup.string().required("Option không được để trống"),
          percentage: yup
            .number()
            .typeError("Percentage phải là số")
            .min(0, "Percentage không nhỏ hơn 0")
            .max(100, "Percentage không lớn hơn 100")
            .required("Vui lòng nhập Percentage"),
        })
      )
      .min(1, "Phải có ít nhất 1 option"),
  }),
});

let options = {
  unlimitedTurns: true,
  copyrightWinner:
    "Quý khách liên hệ hotline {Phone} và qua địa chỉ {Address}!.",
  color: "#d51e1e",
  data: Array(10)
    .fill()
    .map((_) => ({
      option: "",
      percentage: "",
    })),
  ExpiredDate: "30",
  ExpiredDateType: "NGAY_NHAN",
};

let initialValues = {
  options: options,
  ID: 0,
  Title: "",
  Desc: "",
  Content: "",
  Channels: "", //11609
  CreateDate: new Date(),
  IsPublic: true,
  Status: "1",
  Titles: {
    Title: "Vòng quay may mắn",
    Title1: "Quay là trúng - nghìn quà tặng",
    Title2: "",
  },
};

let NAME_CATE_MINIGAME = "Minigame";
let PARENT_CATE_MINIGAME = 836;

function MiniGameSettings(props) {
  const CrStocks = useStore("CrStocks");
  const Auth = useStore("Auth");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...initialValues,
    },
    resolver: yupResolver(schemaUpdate),
  });

  const { fields } = useFieldArray({
    control,
    name: "options.data",
  });

  const MiniGameConfigs = useQuery({
    queryKey: ["MinigameConfigs", CrStocks],
    queryFn: async () => {
      const cates = await ArticleAPI.categories({
        body: {
          pi: 1,
          ps: 50,
          filter: {
            ApplicationKey: "article",
            ParentID: PARENT_CATE_MINIGAME,
            Title: NAME_CATE_MINIGAME,
          },
        },
        token: Auth?.token,
      });
      let CateID = null;
      if (cates?.data?.list && cates?.data?.list.length > 0) {
        CateID =
          cates?.data?.list.find((x) => x.Title === NAME_CATE_MINIGAME)?.ID ||
          null;
      }
      if (CateID) {
        const { data } = await ArticleAPI.get({
          body: {
            pi: 1,
            ps: 10,
            filter: {
              key: "",
              cateid: CateID,
            },
          },
          Token: Auth?.token,
        });

        return data?.list && data?.list.length > 0 ? data?.list[0] : null;
      }
      return null;
    },
    onSuccess: (data) => {
      if (data?.ID) {
        reset({
          ...initialValues,
          options: data?.Content ? JSON.parse(data?.Content) : options,

          Titles: {
            Title: data?.Title?.split(";")?.[0] || "",
            Title1: data?.Title?.split(";")?.[1] || "",
            Title2: data?.Title?.split(";")?.[2] || "",
          },
          ID: data?.ID,
          Status: data?.Status || "1",
          IsPublic: data?.IsPublic ? true : false,
          CreateDate: data?.CreateDate,
        });
      } else {
        reset({ ...initialValues });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ body, Token, Channels }) => {
      let newBody = { ...body };

      if (!Channels) {
        let rs = await ArticleAPI.addEditCategory({
          body: {
            arr: [
              {
                ID: 0,
                Title: NAME_CATE_MINIGAME,
                Desc: "",
                IsPublic: 1,
                Order: 0,
                ApplicationKey: "article",
                ParentID: PARENT_CATE_MINIGAME,
              },
            ],
          },
          Token,
        });
        if (rs?.data?.lst && rs?.data?.lst.length > 0) {
          newBody.arr = newBody.arr.map((item) => ({
            ...item,
            Channels: rs?.data?.lst[0]?.ID,
          }));
        }
      }

      let data = await ArticleAPI.addEdit({ body: newBody, Token });
      await MiniGameConfigs.refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    let newValues = {
      ...values,
      Title: `${values?.Titles?.Title};${values?.Titles?.Title1};${values?.Titles?.Title2}`,
      Content: JSON.stringify(values.options),
      CreateDate: values?.CreateDate
        ? moment(values?.CreateDate).format("HH:mm YYYY-MM-DD")
        : moment().format("HH:mm YYYY-MM-DD"),
      IsPublic: values?.IsPublic ? "1" : "0",
    };

    if (values.Status === "0") {
      newValues.Desc = `/hop-qua-may-man/22/${
        values?.options?.ExpiredDateType === "NGAY_HET_HAN"
          ? moment(values?.options?.ExpiredDate).format("DD-MM-YYYY")
          : values?.options?.ExpiredDate
      }`;
    } else {
      newValues.Desc = `/vong-quay/22/${
        values?.options?.ExpiredDateType === "NGAY_HET_HAN"
          ? moment(values?.options?.ExpiredDate).format("DD-MM-YYYY")
          : values?.options?.ExpiredDate
      }`;
    }

    delete newValues.Titles;
    delete newValues.options;

    updateMutation.mutate(
      {
        Channels: values.Channels,
        body: {
          arr: [newValues],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          toast.success(
            !values?.ID ? "Thêm mới thành công." : "Cập nhật thành công."
          );
          f7.dialog.close();
        },
      }
    );
  };

  let { options } = watch();

  const anyItemError = !!errors?.options?.data?.some(Boolean);

  return (
    <Page
      className="bg-[var(--f7-page-bg-color)]"
      name="MiniGame-Setting"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full font-medium">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            back
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
          Cài đặt MiniGame
        </NavLeft>
        <NavRight className="h-full pr-4">
          <Link
            onClick={() => {
              Fancybox.show(
                [
                  {
                    src: AssetsHelpers.toAbsoluteUrlCore(
                      "/AppCoreV2/images/huong-dan-minigame.jpg",
                      ""
                    ),
                    thumbSrc: AssetsHelpers.toAbsoluteUrlCore(
                      "/AppCoreV2/images/huong-dan-minigame.jpg",
                      ""
                    ),
                  },
                ],
                {
                  Carousel: {
                    Toolbar: {
                      items: {
                        downloadImage: {
                          tpl: '<button class="f-button"><svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"></path></svg></button>',
                          click: () => {
                            PromHelpers.OPEN_LINK(
                              AssetsHelpers.toAbsoluteUrlCore(
                                "/AppCoreV2/images/huong-dan-minigame.jpg",
                                ""
                              )
                            );
                          },
                        },
                      },
                      display: {
                        left: ["counter"],
                        middle: [
                          "zoomIn",
                          "zoomOut",
                          // "toggle1to1",
                          "rotateCCW",
                          "rotateCW",
                          // "flipX",
                          // "flipY",
                        ],
                        right: [
                          "downloadImage",
                          //"thumbs",
                          "close",
                        ],
                      },
                    },
                  },
                }
              );
            }}
            noLinkClass
            className="!text-white h-full flex items-center justify-center text-[14px]"
          >
            Hướng dẫn
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <form className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 overflow-auto grow">
          <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0 flex justify-between items-center">
            <div className="font-medium">Bật Mini Game</div>
            <Controller
              name="IsPublic"
              control={control}
              render={({ field: { ref, ...field }, fieldState }) => (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    {...field}
                    checked={field.value}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                </label>
              )}
            />
          </div>
          <div className="p-4 bg-white rounded-lg mb-3.5 last:mb-0">
            <div className="mb-3.5 last:mb-0">
              <div className="mb-px font-light">Tên chương trình</div>
              <Controller
                rules={{
                  required: true,
                }}
                name={`Titles.Title2`}
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    className="[&_input]:rounded [&_input]:placeholder:normal-case"
                    type="text"
                    placeholder="Nhập tên chương trình"
                    value={field.value}
                    errorMessage={
                      fieldState?.invalid && "Vui lòng nhập tên chương trình"
                    }
                    errorMessageForce={fieldState?.invalid}
                    onInput={field.onChange}
                    clearButton={fieldState?.invalid}
                  />
                )}
              />
            </div>
            <div className="mb-3.5 last:mb-0">
              {/* <div className="mb-px font-light">Loại</div> */}
              <Controller
                name="Status"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="relative flex items-center w-full gap-3"
                      onClick={() => {
                        field.onChange("1");
                        setValue("Titles.Title", "Vòng quay may mắn");
                        setValue(
                          "Titles.Title1",
                          "Quay là trúng - nghìn quà tặng"
                        );
                      }}
                    >
                      <div
                        className={clsx(
                          "flex items-center justify-center w-5 h-5 rounded",
                          field.value === "1" ? "bg-primary" : "bg-gray-200"
                        )}
                      >
                        <CheckIcon
                          className={clsx(
                            "w-4 text-white",
                            field.value === "1" ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                      <div className={clsx("flex-1 font-medium")}>
                        Vòng quay
                      </div>
                    </div>

                    <div
                      className="relative flex items-center w-full gap-3"
                      onClick={() => {
                        field.onChange("0");
                        setValue("Titles.Title", "Mở hộp quà – Nhận bất ngờ");
                        setValue("Titles.Title1", "Một lần mở – ngàn niềm vui");
                      }}
                    >
                      <div
                        className={clsx(
                          "flex items-center justify-center w-5 h-5 rounded",
                          field.value === "0" ? "bg-primary" : "bg-gray-200"
                        )}
                      >
                        <CheckIcon
                          className={clsx(
                            "w-4 text-white",
                            field.value === "0" ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                      <div className={clsx("flex-1 font-medium")}>Hộp quà</div>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          <Disclosure initialState={false}>
            {({ isOpen, toggle }) => (
              <div className="bg-white rounded-lg mb-3.5 last:mb-0">
                <div
                  className="flex items-center justify-between px-4 py-4"
                  onClick={toggle}
                >
                  <div
                    className={clsx(
                      "font-medium text-[15px]",
                      !isOpen && anyItemError && "text-danger"
                    )}
                  >
                    Giải thưởng
                  </div>
                  <div>
                    <ChevronDownIcon
                      className={clsx(
                        "w-5 text-gray-500 transition-all",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-5">
                    <div className="mb-px font-light">
                      Tên giải thưởng / Tỉ lệ trúng
                    </div>
                    {fields &&
                      fields.map((item, index) => (
                        <div
                          className="relative mb-3 rounded last:mb-0"
                          key={item.id}
                        >
                          <div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Controller
                                  rules={{
                                    required: true,
                                  }}
                                  name={`options.data[${index}].option`}
                                  control={control}
                                  render={({ field, fieldState }) => (
                                    <Input
                                      className="[&_input]:rounded [&_input]:placeholder:normal-case"
                                      type="text"
                                      placeholder="Nhập tên giải thưởng"
                                      value={field.value}
                                      errorMessage={
                                        fieldState?.invalid &&
                                        "Vui lòng nhập tên giải thưởng"
                                      }
                                      errorMessageForce={fieldState?.invalid}
                                      onInput={field.onChange}
                                      clearButton={fieldState?.invalid}
                                    />
                                  )}
                                />
                              </div>
                              <div className="w-[90px]">
                                <Controller
                                  rules={{
                                    required: true,
                                  }}
                                  name={`options.data[${index}].percentage`}
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
                                        thousandSeparator={false}
                                        placeholder="Nhập"
                                        value={field.value}
                                        onValueChange={(val) => {
                                          field.onChange(
                                            typeof val?.floatValue ===
                                              "undefined"
                                              ? val?.value
                                              : val?.floatValue
                                          );
                                        }}
                                        isAllowed={(values) => {
                                          const { floatValue } = values;
                                          return (
                                            floatValue === undefined ||
                                            floatValue <= 100
                                          );
                                        }}
                                      />
                                      <div className="absolute top-0 right-0 flex items-center justify-center w-12 h-full text-gray-500 pointer-events-none">
                                        %
                                      </div>
                                    </div>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </Disclosure>
          <Disclosure initialState={false}>
            {({ isOpen, toggle }) => (
              <div className="mb-3.5 bg-white rounded-lg last:mb-0">
                <div
                  className="flex items-center justify-between px-4 py-4"
                  onClick={toggle}
                >
                  <div className="font-medium text-[15px]">
                    Hạn dùng của giải thưởng
                  </div>
                  <div>
                    <ChevronDownIcon
                      className={clsx(
                        "w-5 text-gray-500 transition-all",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div>
                      <Controller
                        name="options.ExpiredDateType"
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="font-light">
                              {field.value === "NGAY_NHAN"
                                ? "Số ngày"
                                : "Ngày hết hạn"}
                            </div>
                            <div
                              onClick={() => {
                                if (field.value === "NGAY_NHAN") {
                                  field.onChange("NGAY_HET_HAN");
                                  setValue("options.ExpiredDate", new Date());
                                } else {
                                  field.onChange("NGAY_NHAN");
                                  setValue("options.ExpiredDate", "30");
                                }
                              }}
                            >
                              <ArrowPathIcon className="w-5" />
                            </div>
                          </div>
                        )}
                      />
                      {options.ExpiredDateType === "NGAY_NHAN" && (
                        <Controller
                          name="options.ExpiredDate"
                          control={control}
                          render={({ field, fieldState }) => (
                            <div>
                              <div className="relative">
                                <Input
                                  className="[&_input]:rounded [&_input]:placeholder:normal-case"
                                  type="text"
                                  placeholder="Nhập số ngày"
                                  value={field.value}
                                  errorMessageForce={fieldState?.invalid}
                                  errorMessage={
                                    fieldState?.invalid &&
                                    "Vui lòng nhập số ngày"
                                  }
                                  onInput={field.onChange}
                                  clearButton={fieldState?.invalid}
                                />
                                <div className="absolute top-0 right-0 flex items-center justify-center w-12 h-full pr-4 text-gray-500 pointer-events-none">
                                  Ngày
                                </div>
                              </div>
                              <div className="mt-2 text-gray-500">
                                Giải thưởng được dùng trong
                                <span className="px-1">{field.value || 0}</span>
                                ngày kể từ ngày tham gia
                              </div>
                            </div>
                          )}
                        />
                      )}
                      {options.ExpiredDateType === "NGAY_HET_HAN" && (
                        <Controller
                          name="options.ExpiredDate"
                          control={control}
                          render={({ field, fieldState }) => (
                            <div>
                              <DatePicker
                                format="DD-MM-YYYY"
                                errorMessage={fieldState?.error?.message}
                                errorMessageForce={fieldState?.invalid}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Chọn ngày hết hạn"
                                showHeader
                              />
                              {field.value && (
                                <div className="mt-2 text-gray-500">
                                  Giải thưởng có giá trị đến ngày
                                  <span className="px-1">
                                    {moment(field.value).format("DD/MM/YYYY")}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Disclosure>
          <Disclosure initialState={false}>
            {({ isOpen, toggle }) => (
              <div className="mb-3.5 bg-white rounded-lg last:mb-0">
                <div
                  className="flex items-center justify-between px-4 py-4 mb-2"
                  onClick={toggle}
                >
                  <div className="font-medium text-[15px]">Thông tin khác</div>
                  <div>
                    <ChevronDownIcon
                      className={clsx(
                        "w-5 text-gray-500 transition-all",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Nội dung quảng cáo</div>
                      <div className="mb-2">
                        <Controller
                          rules={{
                            required: true,
                          }}
                          name={`Titles.Title`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <Input
                              className="[&_input]:rounded [&_input]:placeholder:normal-case"
                              type="text"
                              placeholder="Nhập tiêu đề"
                              value={field.value}
                              errorMessage={
                                fieldState?.invalid && "Vui lòng nhập tiêu đề"
                              }
                              errorMessageForce={fieldState?.invalid}
                              onInput={field.onChange}
                              clearButton={fieldState?.invalid}
                            />
                          )}
                        />
                      </div>
                      <Controller
                        rules={{
                          required: true,
                        }}
                        name={`Titles.Title1`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_input]:rounded [&_input]:placeholder:normal-case"
                            type="text"
                            placeholder="Nhập mô tả"
                            value={field.value}
                            errorMessage={
                              fieldState?.invalid && "Vui lòng nhập mô tả"
                            }
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                            clearButton={fieldState?.invalid}
                          />
                        )}
                      />
                    </div>
                    <div className="mb-3.5 last:mb-0">
                      <div className="mb-px font-light">Thông tin liên hệ</div>
                      <Controller
                        rules={{
                          required: true,
                        }}
                        name={`options.copyrightWinner`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case [&_textarea]:min-h-[100px]"
                            type="textarea"
                            placeholder="Nhập thông tin"
                            value={field.value}
                            errorMessageForce={fieldState?.invalid}
                            onInput={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Disclosure>
          <Disclosure initialState={false}>
            {({ isOpen, toggle }) => (
              <div className="mb-3.5 bg-white rounded-lg last:mb-0">
                <div
                  className="flex items-center justify-between px-4 py-4 mb-2"
                  onClick={toggle}
                >
                  <div className="font-medium text-[15px]">Khác</div>
                  <div>
                    <ChevronDownIcon
                      className={clsx(
                        "w-5 text-gray-500 transition-all",
                        isOpen && "rotate-180"
                      )}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="mb-3.5 last:mb-0 bg-white rounded-lg">
                      <Controller
                        name="options.unlimitedTurns"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <div>
                            <div
                              className="relative flex items-center w-full gap-3 mb-3.5"
                              onClick={() => {
                                field.onChange(false);
                              }}
                            >
                              <div
                                className={clsx(
                                  "flex items-center justify-center w-5 h-5 rounded",
                                  !field.value ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <CheckIcon
                                  className={clsx(
                                    "w-4 text-white",
                                    !field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                              <div className={clsx("flex-1")}>
                                Mỗi khách hàng quay 1 lần
                              </div>
                            </div>
                            <div
                              className="relative flex items-center gap-3 w-full last:after:hidden after:content-[''] after:w-[calc(100%-30px)] after:h-[1px] after:bg-[var(--f7-page-bg-color)] after:absolute after:right-0 after:bottom-0"
                              onClick={() => {
                                field.onChange(true);
                              }}
                            >
                              <div
                                className={clsx(
                                  "flex items-center justify-center w-5 h-5 rounded",
                                  field.value ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <CheckIcon
                                  className={clsx(
                                    "w-4 text-white",
                                    field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                              <div className={clsx("flex-1")}>
                                Không giới hạn lượt quay / mỗi khách
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Disclosure>
        </div>
        <div className="p-4">
          <Button
            type="submit"
            className="rounded-full bg-app"
            fill
            large
            preloader
            loading={updateMutation.isLoading}
            disabled={updateMutation.isLoading}
          >
            Lưu cài đặt
          </Button>
        </div>
      </form>
    </Page>
  );
}

export default MiniGameSettings;
