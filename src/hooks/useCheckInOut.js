import { useMemo } from "react";
import { useStore } from "framework7-react";
import moment from "moment";

const useCheckInOut = () => {
  const Auth = useStore("Auth");
  const CrsInOut = useStore("CrsInOut");
  const Brand = useStore("Brand");

  const { CheckIn, CheckOut } = useMemo(() => {
    if (!Auth) {
      return { CheckIn: null, CheckOut: null };
    }
    const list = Auth?.WorkTrack?.List || [];
    let inItem = null;
    let outItem = null;

    if (Brand?.Global?.Admin?.roster) {
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (item?.CheckIn && !item?.CheckOut) {
          inItem = item;
          break;
        }
      }
    } else {
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (!inItem && item?.CheckIn) inItem = item;
        if (!outItem && item?.CheckOut) outItem = item;
        if (inItem && outItem) break;
      }
    }

    return { CheckIn: inItem, CheckOut: outItem };
  }, [Auth, Brand]);

  const { CheckInStorage, CheckOutStorage } = useMemo(() => {
    const list = CrsInOut || [];
    const serverDate = Auth?.ServerTime
      ? moment(Auth.ServerTime).format("YYYY-MM-DD")
      : null;

    if (!serverDate || list.length === 0) {
      return { CheckInStorage: null, CheckOutStorage: null };
    }

    let inItem = null;
    let outItem = null;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (
        !inItem &&
        item?.CheckIn &&
        moment(item.CheckIn, "YYYY-MM-DD").format("YYYY-MM-DD") === serverDate
      ) {
        inItem = item;
      }
      if (
        !outItem &&
        item?.CheckOut &&
        moment(item.CheckOut, "YYYY-MM-DD").format("YYYY-MM-DD") === serverDate
      ) {
        outItem = item;
      }
      if (inItem && outItem) break;
    }

    return { CheckInStorage: inItem, CheckOutStorage: outItem };
  }, [CrsInOut, Auth]);

  return {
    CheckIn,
    CheckOut,
    CheckInStorage,
    CheckOutStorage,
  };
};

export default useCheckInOut;
