import {
  ChevronLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Link,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  f7,
  useStore,
} from "framework7-react";
import React, { useState } from "react";
import PromHelpers from "../../helpers/PromHelpers";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AuthAPI from "../../api/Auth.api";
import { useMutation } from "react-query";
import store from "../../js/store";
import KeyboardsHelper from "../../helpers/KeyboardsHelper";
import AssetsHelpers from "@/helpers/AssetsHelpers";

const schemaLogin = yup
  .object({
    pwd: yup.string().required("Vui lòng nhập mật khẩu mới."),
    repwd: yup
      .string()
      .oneOf([yup.ref("pwd"), null], "Mật khẩu không trùng khớp.")
      .required("Vui lòng nhập lại mật khẩu mới."),
    crpwd: yup.string().required("Vui lòng nhập mật khẩu hiện tại."),
  })
  .required();

function ChangePasswordPage({ f7router }) {
  const Auth = useStore("Auth");
  const [hiddenPassword, setHiddenPassword] = useState(true);
  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: {
      pwd: "",
      repwd: "",
      crpwd: "",
    },
    resolver: yupResolver(schemaLogin),
  });

  const changePWDMutation = useMutation({
    mutationFn: (body) => AuthAPI.changePassword(body),
  });

  const onSubmit = ({ pwd, repwd, crpwd }) => {
    var bodyData = new FormData();
    bodyData.append("pwd", pwd);
    bodyData.append("repwd", repwd);
    bodyData.append("crpwd", crpwd);

    changePWDMutation.mutate(
      {
        Token: Auth.token,
        data: bodyData,
      },
      {
        onSuccess: ({ data }) => {
          if (data?.success) {
            store
              .dispatch("setAuth", { ...Auth, token: data.data.token })
              .then(() => {
                f7.dialog.alert("Thay đổi mật khẩu thành công.", () => {
                  reset();
                });
              });
          } else {
            setError("crpwd", {
              type: "Server",
              message: data.error,
            });
          }
        },
        onError: (err) => console.log(err),
      }
    );
  };

  return (
    <Page
      noToolbar
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
      className="bg-white"
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
        <NavTitle>Thay đổi mật khẩu</NavTitle>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
      <div className="p-4 overflow-auto bg-white rounded-t-xl grow no-scrollbar">
        <div className="flex items-center justify-center mb-8">
          <img
            className="w-9/12"
            src={AssetsHelpers.toAbsoluteUrlCore(
              "/AppCoreV2/images/change-pwd-icon.jpg",
              ""
            )}
            alt=""
          />
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <div className="mb-px">Mật khẩu cũ</div>
            <Controller
              name="crpwd"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  className="[&_input]:rounded [&_input]:placeholder:normal-case"
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={field.value}
                  errorMessage={fieldState?.error?.message}
                  errorMessageForce={fieldState?.invalid}
                  onInput={field.onChange}
                  clearButton={true}
                  onFocus={(e) =>
                    KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                  }
                />
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px">Mật khẩu mới</div>
            <Controller
              name="pwd"
              control={control}
              render={({ field, fieldState }) => (
                <div className="relative">
                  <Input
                    className="[&_input]:rounded [&_input]:placeholder:normal-case"
                    type={hiddenPassword ? "password" : "text"}
                    placeholder="Nhập mật khẩu mới"
                    value={field.value}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    onChange={field.onChange}
                    onFocus={(e) =>
                      KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                    }
                  />
                  <div
                    className="absolute w-12 h-[47px] right-0 top-0 flex items-center justify-center"
                    onClick={() => setHiddenPassword(!hiddenPassword)}
                  >
                    {hiddenPassword ? (
                      <EyeSlashIcon className="w-4" />
                    ) : (
                      <EyeIcon className="w-4" />
                    )}
                  </div>
                </div>
              )}
            />
          </div>
          <div className="mb-4">
            <div className="mb-px">Nhập lại mật khẩu mới</div>
            <Controller
              name="repwd"
              control={control}
              render={({ field, fieldState }) => (
                <div className="relative">
                  <Input
                    className="[&_input]:rounded [&_input]:lowercase [&_input]:placeholder:normal-case"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={field.value}
                    errorMessage={fieldState?.error?.message}
                    errorMessageForce={fieldState?.invalid}
                    onInput={field.onChange}
                    clearButton={true}
                    onFocus={(e) =>
                      KeyboardsHelper.setAndroid({ Type: "body", Event: e })
                    }
                  />
                </div>
              )}
            />
          </div>
          <Button
            type="submit"
            className="normal-case bg-app"
            fill
            large
            preloader
            loading={changePWDMutation.isLoading}
            disabled={changePWDMutation.isLoading}
          >
            Lưu thay đổi
          </Button>
        </form>
      </div>
    </Page>
  );
}
export default ChangePasswordPage;
