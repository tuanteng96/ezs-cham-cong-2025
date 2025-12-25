import moment from "moment";
import PromHelpers from "./PromHelpers";
import AdminAPI from "@/api/Admin.api";

/**
 * ##Get
 * @operatingSystem {string} Hệ điều hành ANDROID hay IOS
 * @deviceId {string} ID của thiết bị
 * @systemName {string}
 * @systemVersion {string} Phiên bản hệ điều hành
 */

const get = ({ success, fail }) => {
  if (import.meta.env.DEV || window.DEV) {
    success && success({ deviceId: "66F19A60-9DA3-488A-805D-B3D290A023A5" });
  } else {
    PromHelpers.GET_DEVICE()
      .then((response) => {
        if (response.success) {
          let DevicesOption = {};
          let Devices = response.data.split(",");
          for (let key of Devices) {
            let values = key.split(":");
            if (values.length === 1) {
              DevicesOption.operatingSystem = values[0];
            } else {
              DevicesOption[values[0]] = values[1];
            }
          }
          if (DevicesOption.MODEL) {
            DevicesOption.deviceId = DevicesOption.MODEL;
          }
          if (DevicesOption.SECUREID) {
            DevicesOption.deviceId =
              DevicesOption.deviceId +
              `-${DevicesOption.SECUREID.toUpperCase()}`;
          }
          
          success && success(DevicesOption);
        } else {
          fail && fail(response.error || "Lỗi không xác định");
        }
      })
      .catch((err) => {
        fail && fail(err);
      });
  }
};

const updateLog = ({ data, deviceId, deviceProps }) => {
  // {DataJSON, token, ID} = data
  let isChange = true;
  let DeviceIDsJSON = data?.DataJSON ? JSON.parse(data?.DataJSON) : [];

  DeviceIDsJSON = DeviceIDsJSON.sort(
    (a, b) =>
      moment(b.CreateDate, "HH:mm DD/MM/YYYY") -
      moment(a.CreateDate, "HH:mm DD/MM/YYYY")
  );

  if (DeviceIDsJSON && DeviceIDsJSON.length > 0) {
    if (DeviceIDsJSON[0].DeviceIDs === deviceId) {
      isChange = false;
    }
  }
  
  if (isChange && data?.ID !== 1) {
    DeviceIDsJSON.unshift({
      CreateDate: moment().format("HH:mm DD/MM/YYYY"),
      DeviceIDs: deviceId,
      Information: deviceProps || null,
      PlatformVersion: window.PlatformVersion || "",
      PlatformId: window.PlatformId || "NO_IOS_ANDROID",
    });

    AdminAPI.saveMachineCode({
      Token: data?.token,
      data: {
        updateList: [
          {
            UserID: data.ID,
            DataJSON: JSON.stringify(DeviceIDsJSON),
          },
        ],
      },
    });
  }
};

const DeviceHelpers = { get, updateLog };

export default DeviceHelpers;
