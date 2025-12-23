import React, { useRef } from "react";
import {
  Link,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  Subnavbar,
  f7,
  useStore,
} from "framework7-react";
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  PhotoIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ArticleAPI from "../../../../api/Article.api";
import { useInfiniteQuery, useMutation } from "react-query";
import ArrayHelpers from "../../../../helpers/ArrayHelpers";
import PromHelpers from "../../../../helpers/PromHelpers";
import NoFound from "../../../../components/NoFound";
import { GridGallery } from "../../../../components";
import { PickerSheet } from "@/partials/components/Sheet";
import { toast } from "react-toastify";
import { TruncatedHtml } from "@/components/common";
import { Fancybox } from "@fancyapps/ui";
import AssetsHelpers from "@/helpers/AssetsHelpers";

function Article({ f7router, f7route }) {
  let Auth = useStore("Auth");

  let isBlog = f7route?.params?.parentid === "835";

  const allowInfinite = useRef(true);
  const articleQuery = useInfiniteQuery({
    queryKey: ["Articles", f7route?.params?.parentid],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await ArticleAPI.get({
        body: {
          filter: {
            key: "",
            cateid: f7route?.params?.parentid,
          },
          pi: pageParam,
          ps: 10,
        },
        Token: Auth?.token
      });
      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.pi === lastPage.pCount ? undefined : lastPage.pi + 1,
  });

  const Lists = ArrayHelpers.useInfiniteQuery(
    articleQuery?.data?.pages,
    "list"
  );

  const deleteMutation = useMutation({
    mutationFn: async (body) => {
      let data = await ArticleAPI.delete(body);
      await articleQuery.refetch();
      return data;
    },
  });

  const loadMore = () => {
    if (!allowInfinite.current) return;
    allowInfinite.current = false;

    articleQuery.fetchNextPage().then(() => {
      allowInfinite.current = true;
    });
  };

  const onDelete = (item) => {
    const dataPost = {
      delete: [item.ID],
    };
    f7.dialog.confirm("Xác nhận xoá bài viết ?", () => {
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
          },
        }
      );
    });
  };

  return (
    <Page
      name="Article"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      ptr
      onPtrRefresh={(done) => articleQuery.refetch().then(() => done())}
      infinite
      infiniteDistance={50}
      infinitePreloader={articleQuery.isLoading}
      onInfinite={loadMore}
      style={{
        "--f7-subnavbar-height": "55px",
      }}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <NavLeft className="h-full font-medium">
          <Link
            noLinkClass
            className="!text-white h-full flex item-center justify-center w-12"
            onClick={() => f7router.back()}
          >
            <ChevronLeftIcon className="w-6" />
          </Link>
          {isBlog ? "Viết bài blogs" : "Đăng bài APP"}
        </NavLeft>
        {!isBlog && (
          <NavRight className="h-full pr-4">
            <Link
              onClick={() => {
                Fancybox.show(
                  [
                    {
                      src: AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/huong-dan-noti-nail.jpg",
                        ""
                      ),
                      thumbSrc: AssetsHelpers.toAbsoluteUrlCore(
                        "/AppCoreV2/images/huong-dan-noti-nail.jpg",
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
                                  "/AppCoreV2/images/huong-dan-noti-nail.jpg",
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
        )}

        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
        <Subnavbar
          className="after:hidden border-b-[1px]"
          style={{
            "--f7-subnavbar-height": "55px",
          }}
        >
          <div
            className="flex items-center justify-between w-full h-full px-2"
            onClick={() =>
              f7router.navigate(
                `/admin/article/${f7route?.params?.parentid}/add/`
                // {
                //   replaceState: true,
                // }
              )
            }
          >
            <div className="relative mr-3 overflow-hidden bg-gray-100 rounded-full w-9 h-9">
              <svg
                className="absolute text-gray-400 w-11 h-11 -left-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-[15px] text-[#999] bg-[#efeff3] flex-1 h-9 rounded-3xl px-5 flex items-center">
              Bắt đầu viết bài ?
            </div>
            <div className="ml-4 text-success">
              <PhotoIcon className="w-6" />
            </div>
          </div>
        </Subnavbar>
      </Navbar>
      {articleQuery.isLoading && (
        <div>
          {Array(2)
            .fill()
            .map((_, index) => (
              <div
                className="p-4 mb-1.5 bg-white last:mb-0 animate-pulse grid grid-cols-2 gap-1"
                key={index}
              >
                <div className="flex items-center justify-center bg-gray-300 rounded-sm aspect-square">
                  <svg
                    className="w-10 h-10 text-gray-200"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 20"
                  >
                    <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
                    <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center bg-gray-300 rounded-sm aspect-square">
                  <svg
                    className="w-10 h-10 text-gray-200"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 20"
                  >
                    <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
                    <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center bg-gray-300 rounded-sm aspect-square">
                  <svg
                    className="w-10 h-10 text-gray-200"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 20"
                  >
                    <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
                    <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center bg-gray-300 rounded-sm aspect-square">
                  <svg
                    className="w-10 h-10 text-gray-200"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 20"
                  >
                    <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z" />
                    <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
                  </svg>
                </div>
              </div>
            ))}
        </div>
      )}
      {!articleQuery.isLoading && (
        <>
          {Lists &&
            Lists.length > 0 &&
            Lists.map((item, index) => (
              <div
                className="flex flex-col p-4 mb-2.5 bg-white last:mb-0"
                key={index}
                onClick={() => {
                  if (isBlog) return;
                  f7router.navigate(
                    `/admin/article/${f7route?.params?.parentid}/${item.ID}/`
                    // {
                    //   replaceState: true,
                    // }
                  );
                }}
              >
                <div>
                  <GridGallery photos={[...item.PhotoList]} />
                </div>
                {isBlog && (
                  <>
                    <div className="flex mt-4">
                      <div className="flex-1 pr-4 text-base font-semibold">
                        {item.Title}
                      </div>
                      <PickerSheet
                        Title={item.Title}
                        Options={[
                          {
                            Title: "Xem & chỉnh sửa",
                            onClick: () => {
                              f7router.navigate(
                                `/admin/article/${f7route?.params?.parentid}/${item.ID}/`
                              );
                            },
                            autoClose: true,
                          },

                          {
                            Title: "Xoá bài viết",
                            className:
                              "flex items-center justify-center h-[54px] border-b last:border-0 text-[15px] cursor-pointer text-danger",
                            onClick: (e) => {
                              onDelete(item);
                            },
                            autoClose: true,
                          },
                        ]}
                        Close={{
                          Title: "Đóng",
                        }}
                      >
                        {({ open }) => (
                          <div
                            className="flex items-baseline justify-end w-12"
                            onClick={open}
                          >
                            <EllipsisHorizontalIcon className="w-7" />
                          </div>
                        )}
                      </PickerSheet>
                    </div>
                    <div className="mt-2">
                      <div
                        className="text-gray-700 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: item.Desc,
                        }}
                      />
                    </div>
                  </>
                )}

                {!isBlog && item?.Content && (
                  <TruncatedHtml
                    className="inline-block max-w-full mt-4 leading-[22px] text-[#080809]"
                    ellipsisClass="cursor-pointer font-medium"
                    html={item?.Content}
                    lines={4}
                  />
                )}
              </div>
            ))}
          {(!Lists || Lists.length === 0) && (
            <NoFound
              Title="Không có kết quả nào."
              Desc="Rất tiếc ... Không tìm thấy dữ liệu nào"
            />
          )}
        </>
      )}
    </Page>
  );
}

export default Article;
