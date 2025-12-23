import {
  Button,
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
import React, { useEffect, useRef } from "react";
import PromHelpers from "../../../../helpers/PromHelpers";
import {
  ChevronLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import AssetsHelpers from "../../../../helpers/AssetsHelpers";
import ArticleAPI from "../../../../api/Article.api";
import moment from "moment";
import StringHelpers from "../../../../helpers/StringHelpers";
import clsx from "clsx";
import { UploadImagesIcon } from "@/partials/forms/files";
import { SelectPicker } from "@/partials/forms";
import {
  ChevronDownIcon,
  NewspaperIcon,
  PhotoIcon as PhotoIconSolid,
} from "@heroicons/react/24/solid";

let options = [
  {
    label: "Bài đăng",
    value: "0",
  },
  {
    label: "Thư viện",
    value: "1",
  },
];

function ArticleAddAdmin({ f7router, f7route }) {
  let { id, parentid } = f7route.params;

  let isBlog = parentid === "835";
  const isAddMode = id === "add";
  const queryClient = useQueryClient();
  const Auth = useStore("Auth");

  const buttonRef = useRef("");
  const editorRef = useRef(null);
  const selectRef = useRef(null);

  const schemaAdd = yup.object({
    Title: yup.string().when([], {
      is: () => isBlog,
      then: (schema) => schema.required("Vui lòng nhập tiêu đề bài viết."),
      otherwise: (schema) => schema,
    }),
  });

  const methods = useForm({
    defaultValues: {
      ID: 0,
      Title: "",
      Desc: "",
      Content: "",
      Thumbnail: null,
      PhotoList: [],
      Channels: null,
      CreateDate: new Date(),
      Order: 0,
      IsPublic: 1,
      Status: "",
    },
    resolver: yupResolver(schemaAdd),
  });

  const { control, handleSubmit, setValue, watch, reset } = methods;

  useEffect(() => {
    if (isAddMode) {
      if (!isBlog) {
        setValue("Status", "0");
      }
    }
  }, [isAddMode, isBlog]);

  useQuery({
    queryKey: ["PostsID", id],
    queryFn: async () => {
      const { data } = await ArticleAPI.get({
        body: {
          pi: 1,
          ps: 10,
          filter: {
            ID: id,
          },
        },
        Token: Auth?.token,
      });
      return data && data?.list?.length > 0 ? data?.list[0] : null;
    },
    onSuccess: (data) => {
      if (data) {
        let Thumbnail = "";

        reset({
          ID: data.ID,
          Title: data.Title,
          Desc: "",
          Content: data.Desc + data.Content,
          Thumbnail,
          PhotoList:
            data?.PhotoList?.length > 0
              ? data?.PhotoList.map((x) => ({
                  Src: x,
                }))
              : null,
          Channels: data.Channels,
          CreateDate: data.CreateDate,
          Order: data.Order,
          IsPublic: data.IsPublic,
          Status: data?.Status,
        });

        f7.dialog.close();
      }
    },
    enabled: !isAddMode,
  });

  const { fields, remove, append } = useFieldArray({
    control,
    name: "PhotoList",
  });

  const watchForm = watch();

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ArticleAPI.addEdit(body);
      await queryClient.invalidateQueries({ queryKey: ["Articles"] });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ArticleAPI.delete(body);
      await queryClient.invalidateQueries({ queryKey: ["Articles"] });
      return data;
    },
  });

  const uploadFileEditor = async (images) => {
    for (let Src of images) {
      append({ Src });
    }
  };

  function makeTitle(str, maxLength = 50) {
    const plainText = str.replace(/<[^>]+>/g, "").trim();
    if (plainText.length <= maxLength) return plainText;

    return plainText.substring(0, maxLength).trim() + "...";
  }

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let newContent = values.Content;
    let { result } = StringHelpers.getMultipleIndexOf(values.Content, "<div>");
    let Desc = "";
    let Content = "";

    if (isBlog) {
      if (result && result.length > 0) {
        for (let index of result) {
          if (index > 50) {
            Desc = newContent.slice(0, index);
            Content = newContent.slice(index, newContent.length);
            break;
          }
        }
      } else {
        let { result: resultP } = StringHelpers.getMultipleIndexOf(
          values.Content,
          "</p>"
        );
        if (resultP && resultP.length > 0) {
          for (let index of resultP) {
            if (index > 50) {
              Desc = newContent.slice(0, index + 4);
              Content = newContent.slice(index + 4, newContent.length);
              break;
            }
          }
        } else {
          Content = newContent;
        }
      }
    } else {
      Content = newContent;
    }

    let newPhotoList = [];

    if (values.PhotoList && values.PhotoList.length > 0) {
      for (let img of values.PhotoList) {
        newPhotoList.push(img.Src);
      }
    }
    updateMutation.mutate(
      {
        body: {
          arr: [
            {
              ...values,
              Title: !isBlog ? makeTitle(values.Content, 50) : values.Title,
              Desc: Desc,
              Content,
              Thumbnail: "",
              PhotoList: newPhotoList,
              Channels: parentid || 835,
              CreateDate: values?.CreateDate
                ? moment(values?.CreateDate).format("HH:mm YYYY-MM-DD")
                : moment().format("HH:mm YYYY-MM-DD"),
            },
          ],
        },
        Token: Auth?.token,
      },
      {
        onSuccess: (data) => {
          toast.success(
            isAddMode ? "Thêm mới thành công." : "Cập nhật thành công."
          );
          f7.dialog.close();
          f7router.back();
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

  const onDelete = () => {
    const dataPost = {
      delete: [watchForm.ID],
    };
    f7.dialog.confirm("Bạn có chắc chắn muốn xoá bài viết này?", () => {
      f7.dialog.preloader("Đang thực hiện ...");
      deleteMutation.mutate(
        {
          body: dataPost,
          Token: Auth?.token,
        },
        {
          onSuccess: () => {
            toast.success("Xoá thành công.");
            f7.dialog.close();
            f7router.back();
          },
        }
      );
    });
  };

  return (
    <Page
      className="bg-white"
      name="NotificationsAdd"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      onPageAfterOut={() => {
        reset();
      }}
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
        <NavTitle>{isAddMode ? "Tạo bài viết" : "Chỉnh sửa bài viết"}</NavTitle>

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        {isBlog && (
          <form
            className="relative flex flex-col h-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="Title"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <input
                    className={clsx(
                      "w-full px-4 border-b h-14",
                      fieldState?.invalid && "border-danger placeholder-danger"
                    )}
                    type="text"
                    placeholder="Tiêu đề bài viết"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </div>
              )}
            />
            <Controller
              name="Content"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <TextEditor
                    className="!border-0 !shadow-none !rounded-none grow"
                    //resizable
                    placeholder="Nhập nội dung..."
                    buttons={[
                      ["bold", "italic", "underline"],
                      ["orderedList", "unorderedList"],
                    ]}
                    value={field.value}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    onTextEditorChange={field.onChange}
                  />
                  <div className="absolute flex h-11 top-[56px] z-[10000] right-0 pr-2">
                    <UploadImagesIcon
                      isMultiple={true}
                      className="flex items-center justify-center h-full w-11 text-[#333]"
                      onChange={(images) => uploadFileEditor(images)}
                    >
                      <PhotoIcon className="w-7" />
                    </UploadImagesIcon>
                    <div
                      className="flex items-center justify-center h-full w-11 text-[#333]"
                      onClick={() => {
                        f7.dialog.prompt("Nhập Mã Video Youtube", (video) => {
                          setValue(
                            "Content",
                            `${watchForm.Content} <div class="mt-2"><iframe class="w-full" height="200" src="https://www.youtube.com/embed/${video}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
                          );
                        });
                      }}
                    >
                      <VideoCameraIcon className="w-7" />
                    </div>
                  </div>
                </>
              )}
            />
            {fields && fields.length > 0 && (
              <div className="grid grid-cols-4 gap-2 px-4 pt-4">
                {fields &&
                  fields.map((image, index) => (
                    <div
                      className="relative object-contain w-full rounded group aspect-square"
                      key={image.id}
                    >
                      <div
                        className="absolute z-10 flex items-center justify-center w-5 h-5 text-white transition bg-gray-700 border border-white rounded-full shadow-xl cursor-pointer top-1 right-1"
                        onClick={() => remove(index)}
                      >
                        <XMarkIcon className="w-3.5" />
                      </div>
                      <img
                        className="object-contain w-full border rounded aspect-square"
                        src={AssetsHelpers.toAbsoluteUrl(image.Src)}
                        alt=""
                      />
                    </div>
                  ))}
              </div>
            )}

            <div className="p-4">
              <Button
                type="submit"
                className="rounded-full bg-app"
                fill
                large
                preloader
                loading={updateMutation.isLoading}
                disabled={updateMutation.isLoading}
                ref={buttonRef}
              >
                {isAddMode ? "Đăng bài" : "Cập nhật"}
              </Button>
            </div>
          </form>
        )}
        {!isBlog && (
          <form
            className="relative flex flex-col h-full"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="Content"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <TextEditor
                    ref={editorRef}
                    className="!border-0 !shadow-none !rounded-none grow hidden-toolbar"
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
                    onTextEditorChange={field.onChange}
                  />
                </>
              )}
            />
            {fields && fields.length > 0 && (
              <div className="grid grid-cols-4 gap-2 px-4 pt-4">
                {fields &&
                  fields.map((image, index) => (
                    <div
                      className="relative object-contain w-full rounded group aspect-square"
                      key={image.id}
                    >
                      <div
                        className="absolute z-10 flex items-center justify-center w-5 h-5 text-white transition bg-gray-700 border border-white rounded-full shadow-xl cursor-pointer top-1 right-1"
                        onClick={() => remove(index)}
                      >
                        <XMarkIcon className="w-3.5" />
                      </div>
                      <img
                        className="object-contain w-full border rounded aspect-square"
                        src={AssetsHelpers.toAbsoluteUrl(image.Src)}
                        alt=""
                      />
                    </div>
                  ))}
              </div>
            )}

            <div className="p-4">
              <div className="mb-4 flex border rounded-md border-[#D0D3D7] pl-3 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
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
                <div className="flex items-center pr-4">
                  <Controller
                    name="Status"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div>
                        <div
                          className="flex items-center px-2.5 bg-[#E2E5E9] h-[30px] rounded-full text-[13px]"
                          onClick={() => {
                            selectRef?.current?.click();
                          }}
                        >
                          {field.value === "0" && (
                            <>
                              <NewspaperIcon className="w-4 mr-1.5" />
                              Bài đăng
                            </>
                          )}
                          {field.value === "1" && (
                            <>
                              <PhotoIconSolid className="w-4 mr-1.5" />
                              Thư viện
                            </>
                          )}

                          <ChevronDownIcon className="w-4 ml-1" />
                        </div>
                        <div className="hidden">
                          <SelectPicker
                            ref={selectRef}
                            isClearable={false}
                            placeholder="Chọn loại"
                            value={
                              field.value
                                ? options.find((x) => x.value === field.value)
                                : field.value
                            }
                            options={options}
                            label="Chọn loại"
                            onChange={(val) => field.onChange(val?.value || "")}
                            errorMessage={fieldState?.error?.message}
                            errorMessageForce={fieldState?.invalid}
                            autoHeight
                          />
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {watchForm?.ID ? (
                  <Button
                    type="button"
                    className="rounded-full bg-danger w-[80px]"
                    fill
                    large
                    preloader
                    loading={updateMutation.isLoading}
                    disabled={updateMutation.isLoading}
                    onClick={onDelete}
                  >
                    Xoá
                  </Button>
                ) : (
                  <></>
                )}

                <Button
                  type="submit"
                  className="flex-1 rounded-full bg-app"
                  fill
                  large
                  preloader
                  loading={updateMutation.isLoading}
                  disabled={
                    updateMutation.isLoading ||
                    (!makeTitle(watchForm?.Content) &&
                      watchForm.PhotoList.length === 0)
                  }
                  ref={buttonRef}
                >
                  {isAddMode ? "Đăng bài" : "Cập nhật"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </FormProvider>
    </Page>
  );
}

export default ArticleAddAdmin;
