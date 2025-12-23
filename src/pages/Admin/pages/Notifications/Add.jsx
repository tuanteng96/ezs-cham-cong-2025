import {
  Button,
  Input,
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  TextEditor,
  f7,
  useStore,
} from "framework7-react";
import React, { useEffect, useRef, useState } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  CheckIcon,
  ChevronLeftIcon,
  ListBulletIcon,
  PhotoIcon,
  PlusIcon,
  VideoCameraIcon,
  WifiIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Controller, set, useFieldArray, useForm } from "react-hook-form";
import { DatePicker, SelectPickersGroup } from "../../../../partials/forms";
import KeyboardsHelper from "../../../../helpers/KeyboardsHelper";
import { UploadFile } from "../../components";
import { useMutation, useQuery, useQueryClient } from "react-query";
import NotificationsAPI from "../../../../api/Notifications.api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import AssetsHelpers from "../../../../helpers/AssetsHelpers";
import MoresAPI from "../../../../api/Mores.api";
import { AnimatePresence, motion } from "framer-motion";
import { UploadImages, UploadImagesIcon } from "@/partials/forms/files";
import { PickerSheet } from "@/partials/components/Sheet";
import { PickerNotificationSettings } from "./components";
import moment from "moment";
import clsx from "clsx";

const TypeLinks = [
  //   {
  //     label: "Tới danh mục tin tức",
  //     value: "NEWS",
  //   },
  //   {
  //     label: "Tới bài viết tin tức",
  //     value: "NEWS_DETAIL",
  //   },
  {
    label: "Tới sản phẩm, dịch vụ khuyến mại",
    value: "SALE",
  },
  //   {
  //     label: "Tới nhóm sản phẩm, dịch vụ",
  //     value: "CATE_ID",
  //   },
  //   {
  //     label: "Tới chi tiết sản phẩm, dịch vụ",
  //     value: "PROD_ID",
  //   },
  //   {
  //     label: "Tới chi tiết Media, Video",
  //     value: "ADV_ID",
  //   },
  //   {
  //     label: "Tới chi tiết dịch vụ gốc",
  //     value: "SERVICE_ID",
  //   },
  {
    label: "Tới danh sách Voucher",
    value: "VOUCHER",
  },
  //   {
  //     label: "Tới dịch vụ gốc",
  //     value: "CATE_SERVICE_ID",
  //   },
  //   {
  //     label: "Tới đặt lịch dịch vụ",
  //     value: "BOOK_SERVICE",
  //   },
  {
    label: "Tới form đăng ký ưu đãi",
    value: "FORM_SALES",
  },
];

let initialState = {
  ID: 0,
  ToMembers: [], //gui cho kh
  SetNotiDate: false,
  ToUserText: "",
  ToMemberText: "",
  Title: "",
  Content: "",
  IsSendEmail: false,
  IsWrapedEmail: false,
  TitleEmail: "",
  ContentEmail: "",
  ToUsers: [],
  NotiDate: null,
  CreateDate: "",
  Type: "",
  Result: "",
  UserID: 0,
  Params: "",
  IsSent: false,
  SentDate: "",
  InVoucherCampaignID: 0,
  NotiData: "",
  AudioSrc: "",
  SumInfo: "",
  Link: "",
  TypeLink: "",
  Thumbnail: "",
  Html: "",
  PathFrame: "",
  IsSchedule: false,
  Thumbnail1: "",
  Thumbnail2: "",
  Photo: "",
  PhotoType: "",
};

const schemaAdd = yup
  .object({
    Title: yup.string().required("Vui lòng nhập tiêu đề."),
    Html: yup.string().required("Vui lòng nhập nội dung."),
    // ToMembers: yup
    //   .array()
    //   .test(
    //     "Vui lòng chọn khách hàng",
    //     "Vui lòng chọn khách hàng",
    //     function (value) {
    //       const { ToUsers } = this.parent;
    //       if (!ToUsers || ToUsers.length === 0) return value.length > 0;
    //       return true;
    //     }
    //   ),
    // ToUsers: yup
    //   .array()
    //   .test(
    //     "Vui lòng chọn nhân viên",
    //     "Vui lòng chọn nhân viên",
    //     function (value) {
    //       const { ToMembers } = this.parent;
    //       if (!ToMembers || ToMembers.length === 0) return value.length > 0;
    //       return true;
    //     }
    //   ),
  })
  .required();

function NotificationAddAdmin({ f7router }) {
  const queryClient = useQueryClient();

  const [isTemplate, setIsTemplate] = useState(true);

  const { Global } = useStore("Brand");
  const Auth = useStore("Auth");

  const editorRef = useRef(null);

  useEffect(() => {
    if (Global?.TemplatesNoti && Global.TemplatesNoti.length > 0) {
      setIsTemplate(true);
    }
  }, []);

  const { control, handleSubmit, setValue, watch, reset, trigger } = useForm({
    defaultValues: initialState,
    resolver: yupResolver(schemaAdd),
  });

  // let Members = useQuery({
  //   queryKey: ["MembersNotifications"],
  //   queryFn: async () => {
  //     const { data } = await NotificationsAPI.getMembersSend();
  //     let newData = [];
  //     if (data?.data) {
  //       for (let key of data?.data) {
  //         const { group, groupid, text, id } = key;
  //         const index = newData.findIndex((item) => item.groupid === groupid);
  //         if (index > -1) {
  //           newData[index].options.push({
  //             label: text === "TAT_CA" ? "Tất cả" : text,
  //             value: id,
  //             ...key,
  //           });
  //         } else {
  //           const newItem = {};
  //           newItem.label = group;
  //           newItem.groupid = groupid;
  //           newItem.options = [
  //             {
  //               label: text === "TAT_CA" ? "Tất cả khách hàng" : text,
  //               value: id,
  //               ...key,
  //             },
  //           ];
  //           newData.push(newItem);
  //         }
  //       }
  //     }
  //     return newData;
  //   },
  // });

  // let Users = useQuery({
  //   queryKey: ["UsersNotifications"],
  //   queryFn: async () => {
  //     const { data } = await NotificationsAPI.getUsersSend();
  //     let newData = [];
  //     if (data?.data) {
  //       for (let key of data?.data) {
  //         const { group, groupid, text, id } = key;
  //         const index = newData.findIndex((item) => item.groupid === groupid);
  //         if (index > -1) {
  //           newData[index].options.push({
  //             label: text === "TAT_CA" ? "Tất cả" : text,
  //             value: id,
  //             ...key,
  //           });
  //         } else {
  //           const newItem = {};
  //           newItem.label = group === "TAT_CA" ? "Tất cả" : text;
  //           newItem.groupid = groupid;
  //           newItem.options = [
  //             {
  //               label: text === "TAT_CA" ? "Tất cả nhân viên" : text,
  //               value: id,
  //               ...key,
  //             },
  //           ];
  //           newData.push(newItem);
  //         }
  //       }
  //     }
  //     return newData;
  //   },
  // });

  const watchForm = watch();

  const updateMutation = useMutation({
    mutationFn: (body) => NotificationsAPI.send(body),
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");

    updateMutation.mutate(
      {
        noti: {
          ...values,
          Thumbnail: values.Thumbnail1 || values.Thumbnail2 || values.Thumbnail,
          ToMembers: values.ToMembers
            ? values.ToMembers.map((x) => x.value).toString()
            : "",
          ToUsers: values.ToUsers
            ? values.ToUsers.map((x) => x.value).toString()
            : "",
          NotiDate: values.NotiDate
            ? moment(values.NotiDate).format("YYYY-MM-DD HH:mm")
            : null,
          Html: values.Html,
        },
      },
      {
        onSuccess: (data) => {
          queryClient
            .invalidateQueries({ queryKey: ["NotificationsAdmin"] })
            .then(() => {
              f7.dialog.close();
              toast.success("Thực hiện gửi thành công.");
              // f7.views.main.router.navigate("/admin/notifications/");
            });
        },
      }
    );
  };

  const exec = (cmd, value = null) => {
    const editor = editorRef.current?.f7TextEditor; // F7 gán instance ở đây
    if (!editor) return;
    // đảm bảo focus vào contenteditable (nếu selection vẫn tồn tại thì ok)
    try {
      editor.contentEl.focus(); // contentEl là phần <div contenteditable>
    } catch (err) {}
    // thực thi lệnh (F7 dùng execCommand trong ví dụ của họ)
    document.execCommand(cmd, false, value);
    // thay đổi DOM sẽ trigger input -> F7 sẽ xử lý sự kiện change
  };

  const uploadFileEditor = async (images) => {
    const htmlImages =
      images &&
      images
        .map(
          (img) => `<img src="${AssetsHelpers.toAbsoluteUrl(images)}" alt="" />`
        )
        .join(" ");
    setValue("Html", `${watchForm.Html || ""} <div>${htmlImages}</div>`);
  };

  return (
    <Page
      className="bg-white"
      name="NotificationsAdd"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      onPageAfterOut={() => {
        reset(initialState);
      }}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={() => {
              if (!isTemplate) {
                setIsTemplate(true);
                reset(initialState);
              } else {
                f7router.back();
              }
            }}
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
        </NavLeft>
        <NavTitle>Thêm mới thông báo</NavTitle>
        <NavRight className="h-full">
          <Link
            href="/admin/notifications/"
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
          >
            <ListBulletIcon className="w-6" />
          </Link>
        </NavRight>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="relative h-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {!isTemplate && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <form
                className="flex flex-col h-full"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="p-4 overflow-auto grow">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {watchForm.Photo && (
                      <Controller
                        name="Thumbnail1"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <div
                            className={clsx(
                              "relative overflow-hidden rounded border border-gray-200"
                            )}
                            onClick={() => {
                              field.onChange(
                                field.value ? "" : watchForm.Photo
                              );
                              setValue("PhotoType", field.value ? "" : "1");
                              setValue("Thumbnail", "");
                              setValue("Thumbnail2", "");
                            }}
                          >
                            <img
                              className={clsx(
                                "w-full aspect-square object-cover"
                              )}
                              src={AssetsHelpers.toAbsoluteUrl(
                                watchForm.Photo + "?" + new Date().getTime(),
                                ""
                              )}
                              alt=""
                            />
                            {watchForm.PhotoType === "1" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25,
                                  duration: 0.3,
                                }}
                                className="absolute bottom-0 left-0 w-0 h-0 border-r-[40px] border-b-[40px] border-r-transparent border-b-primary"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ delay: 0.1, duration: 0.3 }}
                                  className="absolute left-1 -bottom-9"
                                >
                                  <CheckIcon className="w-4 text-white" />
                                </motion.div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      />
                    )}

                    {watchForm.PathFrame && (
                      <Controller
                        name="Thumbnail"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <div className="relative rounded">
                            <UploadFile
                              {...field}
                              value={
                                field.value ||
                                watchForm.FramePhoto +
                                  "?" +
                                  new Date().getTime()
                              }
                              PathFrame={watchForm.PathFrame}
                              widthClass="w-full"
                              heightClass="h-full"
                              wrapClass="w-full"
                              onChecked={() => {
                                if (field.value) {
                                  field.onChange(
                                    field.value ? "" : field.value
                                  );
                                } else {
                                  field.onChange(watchForm.FramePhoto);
                                }

                                setValue("PhotoType", field.value ? "" : "2");
                                setValue("Thumbnail1", "");
                                setValue("Thumbnail2", "");
                              }}
                              onChange={(image) => {
                                field.onChange(image);

                                setValue("PhotoType", field.value ? "" : "2");

                                setValue("Thumbnail1", "");
                                setValue("Thumbnail2", "");
                              }}
                            />

                            {watchForm.PhotoType === "2" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25,
                                  duration: 0.3,
                                }}
                                className="absolute bottom-0 left-0 w-0 h-0 border-r-[40px] border-b-[40px] border-r-transparent border-b-primary"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ delay: 0.1, duration: 0.3 }}
                                  className="absolute left-1 -bottom-9"
                                >
                                  <CheckIcon className="w-4 text-white" />
                                </motion.div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      />
                    )}

                    <div>
                      <Controller
                        name="Thumbnail2"
                        control={control}
                        render={({ field: { ref, ...field }, fieldState }) => (
                          <div className="relative">
                            <UploadImages
                              width="w-full"
                              height="h-full"
                              onChange={(image) => {
                                field.onChange(field.value ? "" : ("/upload/image/" + image));
                                setValue("PhotoType", image ? "3" : "");

                                setValue("Thumbnail", "");
                                setValue("Thumbnail1", "");
                              }}
                              value={field.value ? field.value.replace("/upload/image/", "") : ""}
                              className="bg-white aspect-square"
                              size="xs"
                              popoverOpen="popover-notification-images"
                              buttonText="Upload ảnh"
                            />
                            {watchForm.PhotoType === "3" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 25,
                                  duration: 0.3,
                                }}
                                className="absolute bottom-0 left-0 w-0 h-0 border-r-[40px] border-b-[40px] border-r-transparent border-b-primary"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ delay: 0.1, duration: 0.3 }}
                                  className="absolute left-1 -bottom-9"
                                >
                                  <CheckIcon className="w-4 text-white" />
                                </motion.div>
                              </motion.div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Controller
                      name="Title"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          className="[&_input]:rounded [&_input]:placeholder:normal-case"
                          type="text"
                          placeholder="Nhập tiêu đề"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                          // clearButton={true}
                        />
                      )}
                    />
                  </div>
                  {/* <div className="mb-4">
                    <div className="mb-px font-light">Tóm tắt</div>
                    <Controller
                      name="Content"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Input
                          resizable
                          className="[&_textarea]:rounded [&_textarea]:placeholder:normal-case"
                          type="textarea"
                          placeholder="Nhập tóm tắt"
                          value={field.value}
                          errorMessage={fieldState?.error?.message}
                          errorMessageForce={fieldState?.invalid}
                          onInput={field.onChange}
                          onFocus={(e) =>
                            KeyboardsHelper.setAndroid({
                              Type: "body",
                              Event: e,
                            })
                          }
                        />
                      )}
                    />
                  </div> */}
                  <div className="mb-4">
                    <Controller
                      name="Html"
                      control={control}
                      render={({ field, fieldState }) => (
                        <>
                          <TextEditor
                            ref={editorRef}
                            className="hidden-toolbar !h-[200px]"
                            //resizable
                            placeholder="Nhập nội dung..."
                            buttons={
                              [
                                // ["bold", "italic", "underline"],
                                // ["orderedList", "unorderedList"],
                              ]
                            }
                            toolbar={false}
                            value={field.value}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            onTextEditorChange={(e) => {
                              let plainText = e.replace(/<[^>]*>/g, "").trim();
                              let words = plainText.split(/\s+/);

                              let shortText =
                                words.length > 20
                                  ? words.slice(0, 20).join(" ")
                                  : plainText;

                              field.onChange(e);
                              setValue("Content", shortText);
                            }}
                          />
                        </>
                      )}
                    />
                    <div className="mt-2.5 flex border rounded-md border-[#D0D3D7] pl-3 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                      <div className="flex flex-1">
                        <div>
                          <UploadImagesIcon
                            isMultiple={true}
                            className="flex items-center justify-center h-12 w-8 text-[#333]"
                            onChange={(images) => uploadFileEditor(images)}
                          >
                            <PhotoIcon className="w-6 text-success" />
                          </UploadImagesIcon>
                        </div>
                      </div>
                      <div className="flex items-center pr-2.5">
                        <div
                          className="flex items-center justify-center w-8 h-12"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("bold")}
                        >
                          <i className="f7-icons text-[20px]">bold</i>
                        </div>

                        <div
                          className="flex items-center justify-center w-8 h-12"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("italic")}
                        >
                          <i className="f7-icons text-[20px]">italic</i>
                        </div>

                        <div
                          className="flex items-center justify-center w-8 h-12"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("underline")}
                        >
                          <i className="f7-icons text-[20px]">underline</i>
                        </div>
                        <div className="relative w-2.5 h-full after:content-[''] after:w-[1px] after:h-7 after:bg-gray-300 after:absolute after:top-2/4 after:-translate-y-2/4 after:left-2/4 after:-translate-x-2/4"></div>

                        <div
                          className="flex items-center justify-center w-8 h-12"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("unorderedList")}
                        >
                          <i className="f7-icons text-[20px]">list_bullet</i>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="mb-4">
              <div className="mb-px font-light">Loại Link</div>
              <Controller
                name="TypeLink"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectPicker
                    isRequired={false}
                    placeholder="Chọn loại Link"
                    value={field.value}
                    options={TypeLinks}
                    label="Chọn loại Link"
                    onChange={(val) => {
                      field.onChange(val);
                      if (!val?.value) {
                        setValue("Link", "");
                      } else if (
                        ["SALE", "VOUCHER", "FORM_SALES"].includes(val.value)
                      ) {
                        if (val.value === "SALE") {
                          setValue("Link", "/shop/hot");
                        }
                        if (val.value === "VOUCHER") {
                          setValue("Link", "/voucher/");
                        }
                        if (val.value === "FORM_SALES") {
                          setValue("Link", "/pupup-contact/");
                        }
                      }
                    }}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                  />
                )}
              />
            </div> */}

                  {/* <div className="mb-4">
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
                            trigger("ToUsers");
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
                            trigger("ToMembers");
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
                        render={({ field: { ref, ...field }, fieldState }) => (
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
                  </div> */}
                  <div className="h-[170px] overflow-hidden">
                    <div className="relative min-h-screen bg-center flex items-center justify-center border-[7px] border-black rounded-[40px] overflow-hidden bg-[radial-gradient(circle_at_bottom_right,#1e293b,#0f172a,#3b0764,#1e1b4b)] bg-[length:200%_200%]">
                      <div className="absolute left-0 flex items-center justify-between w-full px-5 text-white top-3.5 opacity-80">
                        <div className="leading-3 text-[13px]">00:00</div>
                        <div className="flex gap-2">
                          <WifiIcon className="w-4" />
                          <div className="flex items-center gap-[2px] text-white">
                            <div className="relative w-[26px] h-[12px] border border-white/80 rounded-sm overflow-hidden">
                              <div
                                className="absolute top-[1px] left-[1px] bottom-[1px] bg-white rounded-sm"
                                style={{ width: "60%" }}
                              />
                            </div>
                            <div className="w-[2px] h-[6px] bg-white/80 rounded-r-sm" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute z-10 w-20 h-5 transform -translate-x-1/2 bg-black top-3 left-1/2 rounded-xl">
                        <div className="absolute w-1 h-1 p-1 transform -translate-y-1/2 rounded-full bg-slate-800 top-1/2 right-2"></div>
                      </div>
                      <div className="absolute w-full px-3 top-14 animate-ezs-iosNoti">
                        <div className="max-w-lg p-3 rounded-xl backdrop-blur-2xl backdrop-saturate-150 bg-white/20 border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-500">
                          <div className="flex text-white">
                            <div className="w-[40px] min-w-[40px] flex flex-col items-center justify-center">
                              <img
                                className="object-cover rounded-xl aspect-square"
                                src="https://cserbeauty.com/brand/favicon/apple-touch-icon.png"
                                alt=""
                              />
                            </div>

                            <div className="w-[calc(100%-40px)] pl-3">
                              <div className="flex justify-between gap-2 mb-px">
                                <div className="font-semibold truncate">
                                  {watchForm?.Title || ""}
                                </div>
                                <div className="text-[12px] opacity-60 leading-3 flex items-end pb-1">
                                  Now
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <div className="line-clamp-2 text-[13px]">
                                  {watchForm?.Content || ""}
                                </div>
                                {(watchForm.Thumbnail ||
                                  watchForm.Thumbnail1 ||
                                  watchForm.Thumbnail2) && (
                                  <div className="w-[35px] min-w-[35px] flex items-center justify-center">
                                    <img
                                      className="object-cover rounded-lg aspect-square"
                                      src={AssetsHelpers.toAbsoluteUrl(
                                        (watchForm.Thumbnail ||
                                          watchForm.Thumbnail1 ||
                                          watchForm.Thumbnail2) +
                                          "?" +
                                          new Date().getTime(),
                                        ""
                                      )}
                                      alt=""
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <PickerSheet
                    Title="Bạn đang muốn thực hiện gửi thông báo ?"
                    Options={[
                      {
                        GroupTitle: "",
                        Options: [
                          {
                            Title: "Gửi thông báo cho tôi",
                            onClick: (e) => {
                              setValue("ToUsers", [
                                { label: Auth?.FullName, value: Auth?.ID },
                              ]);
                              f7.dialog.confirm(
                                "Xác nhận gửi thông báo cho tôi ?",
                                () => {
                                  handleSubmit(onSubmit)();
                                }
                              );
                            },
                            autoClose: false,
                          },
                          {
                            Title: "Gửi cho tất cả khách hàng",
                            onClick: (e) => {
                              f7.dialog.confirm(
                                "Xác nhận gửi thông báo cho tất cả khách hàng ?",
                                () => {
                                  setValue("ToUsers", []);
                                  setValue("ToMembers", [
                                    {
                                      value: "(-1)",
                                      label: "Tất cả khách hàng",
                                    },
                                  ]);
                                  setValue("IsSchedule", false);
                                  setValue("NotiDate", null);

                                  handleSubmit(onSubmit)();
                                }
                              );
                            },
                            autoClose: false,
                          },
                        ],
                      },
                      {
                        GroupTitle: "",
                        Options: [
                          {
                            Title: "Cấu hình nâng cao",
                            component: ({
                              children,
                              close,
                              setHideForChild,
                            }) => (
                              <PickerNotificationSettings
                                initialValues={watchForm}
                                onOpen={() => {
                                  setHideForChild(true);
                                }}
                                onClose={() => {
                                  setHideForChild(false);
                                  //close();
                                }}
                                onOpenParent={() => setHideForChild(false)}
                                onChange={(values, action) => {
                                  let {
                                    IsSchedule,
                                    NotiDate,
                                    ToUsers,
                                    ToMembers,
                                  } = values;

                                  let texts = [];
                                  if (ToMembers && ToMembers.length > 0) {
                                    texts.push(
                                      `Khách hàng (${ToMembers.map(
                                        (x) => x.label
                                      ).join(",")})`
                                    );
                                  }
                                  if (ToUsers && ToUsers.length > 0) {
                                    texts.push(
                                      `Nhân viên (${ToUsers.map(
                                        (x) => x.label
                                      ).join(",")})`
                                    );
                                  }
                                  if (IsSchedule) {
                                    texts.push(
                                      `Hẹn giờ gửi vào lúc ${moment(
                                        NotiDate
                                      ).format("HH:mm DD/MM/YYYY")}`
                                    );
                                  }

                                  f7.dialog.confirm(
                                    `Xác nhận gửi thông báo cho ${texts.join(
                                      ", "
                                    )} ?`,
                                    () => {
                                      setValue("IsSchedule", IsSchedule);
                                      setValue("NotiDate", NotiDate);
                                      setValue("ToUsers", ToUsers);
                                      setValue("ToMembers", ToMembers);

                                      handleSubmit(onSubmit)();
                                    }
                                  );
                                }}
                              >
                                {({ open }) => (
                                  <div
                                    className="flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer"
                                    onClick={() => {
                                      open();
                                    }}
                                  >
                                    {children}
                                  </div>
                                )}
                              </PickerNotificationSettings>
                            ),
                          },
                        ],
                      },
                    ]}
                    Close={{
                      Title: "Đóng",
                    }}
                  >
                    {({ open }) => (
                      <Button
                        type="button"
                        className="rounded-full bg-app"
                        fill
                        large
                        preloader
                        loading={updateMutation.isLoading}
                        disabled={
                          watchForm.Title.trim() === "" ||
                          watchForm.Html.trim() === ""
                        }
                        onClick={open}
                      >
                        Tiếp tục
                        {/* {watchForm.IsSchedule ? "Đặt lịch gửi" : "Thực hiện gửi"} */}
                      </Button>
                    )}
                  </PickerSheet>
                </div>
              </form>
            </motion.div>
          )}
          {isTemplate && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="absolute inset-0 overflow-auto"
            >
              <div className="relative p-4">
                <div className="grid mb-4">
                  <div
                    className="flex flex-col items-center justify-center h-32 border-[1px] border-[#d5d7da] border-dashed rounded cursor-pointer"
                    onClick={() => setIsTemplate(false)}
                  >
                    <PlusIcon className="w-8 mb-2 text-muted" />
                    <div className="font-meidum text-[15px] mb-px">
                      Tạo mới mặc định
                    </div>
                    <div className="text-muted text-[13px]">
                      Hoặc chọn mẫu bên dưới
                    </div>
                  </div>
                </div>
                <div>
                  {Global?.TemplatesNoti &&
                    Global?.TemplatesNoti.map((group, i) => (
                      <div className="mb-5 last:mb-0" key={i}>
                        <div className="uppercase text-[13px] font-bold mb-2">
                          {group.Title}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {group.Children &&
                            group.Children.map((item, index) => (
                              <div
                                className="cursor-pointer"
                                key={index}
                                onClick={() => {
                                  setValue("Title", item.Title);
                                  setValue("Content", item.Desc);
                                  setValue(
                                    "Html",
                                    item.Desc
                                      ? `${item.Desc} </br> ${item.Html}`
                                      : item.Html
                                  );
                                  setValue("FramePhoto", item.Thumbnail);
                                  setValue("Photo", item.Photo);
                                  setValue("PathFrame", item.PathFrame);
                                  setIsTemplate(false);
                                }}
                              >
                                <div>
                                  <img
                                    className="rounded-sm"
                                    src={AssetsHelpers.toAbsoluteUrl(
                                      item.Thumbnail,
                                      ""
                                    )}
                                    alt={item.Title}
                                  />
                                </div>
                                <div className="pt-2.5">
                                  <div className="mb-1 font-medium line-clamp-2">
                                    {item.Title}
                                  </div>
                                  <div className="text-sm font-light text-muted2 line-clamp-2">
                                    {item.Desc}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}

export default NotificationAddAdmin;
