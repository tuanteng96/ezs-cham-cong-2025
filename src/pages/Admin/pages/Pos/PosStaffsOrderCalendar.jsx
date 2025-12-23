import NoFound from "@/components/NoFound";
import PromHelpers from "@/helpers/PromHelpers";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { toast } from "react-toastify";
import AdminAPI from "@/api/Admin.api";
import { NumericFormat } from "react-number-format";
import clsx from "clsx";

function PosStaffsOrderCalendar(props) {
  const queryClient = useQueryClient();
  let CrStocks = useStore("CrStocks");
  let Auth = useStore("Auth");

  const methods = useForm({
    defaultValues: {
      StockID: "",
      ListDisable: [],
    },
  });

  const { control, handleSubmit, reset, watch } = methods;

  const { fields, remove, append } = useFieldArray({
    control,
    name: "Users",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Staffs-Order-Calendar"],
    queryFn: async () => {
      let { data } = await AdminAPI.listMembersBooking({
        StockID: CrStocks?.ID,
      });
      return data?.data
        ? [...data?.data].sort((a, b) => {
            const orderA = a.source?.Order ?? 0;
            const orderB = b.source?.Order ?? 0;
            if (orderA !== orderB) return orderA - orderB;

            const idA = a.source?.ID ?? 0;
            const idB = b.source?.ID ?? 0;
            return idA - idB;
          })
        : [];
    },
    onSuccess: (rs) => {
      reset({
        Users: rs,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      let data = await AdminAPI.updateStaffsOrder(body);
      await queryClient.invalidateQueries(["ResourcesBookings"]);
      await refetch();
      return data;
    },
  });

  const onSubmit = (values) => {
    f7.dialog.preloader("Đang thực hiện ...");
    let updates = {
      edits: values.Users.map((x) => ({
        Order: x.source?.Order,
        ID: x.source?.ID,
      })),
    };

    updateMutation.mutate(
      { data: updates, Token: Auth?.token },
      {
        onSuccess: () => {
          f7.dialog.close();
          toast.success("Cập nhật thành công");
        },
      }
    );
  };

  return (
    <Page
      className="bg-white"
      name="Pos-staffs-order-calendar"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      noToolbar
      ptr
      onPtrRefresh={async (done) => {
        await refetch();
        done();
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
        <NavTitle>Sắp xếp nhân viên</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full pb-safe-b"
          autoComplete="off"
        >
          {isLoading && (
            <div className="p-4 overflow-auto grow">
              {Array(3)
                .fill()
                .map((_, index) => (
                  <div
                    className="flex items-center pb-4 mb-4 border-b last:mb-0 last:pb-0 last:border-0 animate-pulse"
                    key={index}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
                      <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                    </div>

                    <div className="w-[100px] ml-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {!isLoading && (
            <div className="p-4 overflow-auto grow">
              {fields &&
                fields.length > 0 &&
                fields.map((field, index) => (
                  <div
                    className="flex items-center pb-4 mb-4 border-b last:mb-0 last:pb-0 last:border-0"
                    key={field.id}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{field.text}</div>
                      <div className="text-gray-500">
                        #{field?.source?.ID} - {field?.source.UserName}
                      </div>
                    </div>
                    <Controller
                      name={`Users[${index}].source.Order`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="w-[100px]">
                          <NumericFormat
                            className={clsx(
                              "w-full text-center input-number-format border shadow-[0_4px_6px_0_rgba(16,25,40,.06)] rounded py-3 px-4 focus:border-primary",
                              fieldState?.invalid
                                ? "border-danger"
                                : "border-[#d5d7da]"
                            )}
                            autoComplete="off"
                            thousandSeparator={false}
                            placeholder="Nhập thứ tự"
                            value={field.value}
                            onValueChange={(val) =>
                              field.onChange(
                                typeof val.floatValue === "undefined"
                                  ? val?.value
                                  : val.floatValue
                              )
                            }
                          />
                        </div>
                      )}
                    />
                  </div>
                ))}

              {(!fields || fields.length === 0) && (
                <NoFound
                  Title="Chưa có nhân viên nào."
                  Desc="Vui lòng tạo mới nhân viên tại cơ sở."
                />
              )}
            </div>
          )}
          <div className="p-4">
            <Button
              type="submit"
              className="rounded-full bg-app"
              fill
              large
              preloader
              loading={updateMutation.isLoading || isLoading}
              disabled={updateMutation.isLoading || isLoading}
            >
              Lưu cài đặt
            </Button>
          </div>
        </form>
      </FormProvider>
    </Page>
  );
}

export default PosStaffsOrderCalendar;
