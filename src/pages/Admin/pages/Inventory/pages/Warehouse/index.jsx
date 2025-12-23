import PromHelpers from "@/helpers/PromHelpers";
import { Page, Navbar, Link } from "framework7-react";

export default function Warehouse() {
  return (
    <Page
      className="bg-white"
      name="Warehouse"
      onPageBeforeIn={() => PromHelpers.STATUS_BAR_COLOR("light")}
    >
      <Navbar innerClass="!px-0 text-white" outline={false}>
        <div className="flex w-full h-full px-4 navbar-custom">
          <div className="flex items-center font-semibold">Kho & hàng tồn</div>
        </div>
        <div className="absolute h-[2px] w-full bottom-0 left-0 bg-[rgba(255,255,255,0.3)]"></div>
      </Navbar>
    </Page>
  );
}
