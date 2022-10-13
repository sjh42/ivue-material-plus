import type { InjectionKey } from 'vue';

export type MenuItemList = {
  uid: number
  activeName: (name: string | number) => void
}

export type SubmenuList = {
  uid: number
  submenu: SubmenuProxy
}

export interface SubmenuProxy {
  data: {
    opened: boolean
    active: boolean | string | number
  },
  name: number
}


export type MenuContext = {
  default?: null
  data?: {
    menuItemList: MenuItemList[]
    submenuList: SubmenuList[]
  },
  mode?: string
  menuItemActive?: (name: string | number) => void
  handleEmitSelectEvent?: (name: string | number) => void
  updateOpenKeys?: (name: string | number) => void
  handleMenuItemSelect?: (name: string | number) => void
}

export const MenuContextKey: InjectionKey<MenuContext> =
  Symbol('ivue-menu');
