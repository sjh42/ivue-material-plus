import { createVNode, VNode, render, ComponentPublicInstance } from 'vue';
import { transferIndex, transferIncrease } from '../../utils/transfer-queue';

import Notice from './index.vue';

type Type = 'normal' | 'info' | 'warning' | 'success' | 'error'

type options = {
    title?: string,
    desc?: string,
    onClose?: () => any,
    render?: () => any,
    duration?: number,
    position?: Position,
    offset?: number,
    id?: string,
    zIndex?: number,
    type?: Type,
    closable?: boolean
}

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';


const prefixKey = 'ivue_notice_key_';
let name = 1;

// 队列
const notifications = {
    'top-left': [],
    'top-right': [],
    'bottom-left': [],
    'bottom-right': [],
};

// 每个通知之间的间隙大小
const GAP_SIZE = 16;

let offset;
let defaultDuration;


function notice(type: Type, options: options = {}) {
    // key
    const id = `${prefixKey}${name}`;

    // 标题
    options.title = options.title || '';
    // 描述
    options.desc = options.desc || '';

    // onclose
    options.onClose = options.onClose || function () { };

    // duration
    options.duration = defaultDuration || options.duration;

    name++;

    // 偏移距离
    let verticalOffset = offset || options.offset || 0;
    // 偏移方向
    const position = options.position || 'top-right';

    notifications[position]
        .forEach(({ vm }) => {
            verticalOffset += (vm.el.offsetHeight || 0) + GAP_SIZE;
        });

    verticalOffset += GAP_SIZE;


    // 获取Index
    const handleGetIndex = () => {
        transferIncrease();
        return transferIndex;
    };

    // 当前index
    const tIndex = handleGetIndex();
    // 用户设置的关闭回调
    const userOnClose = options.onClose;

    options = {
        // default options end
        ...options,
        type,
        onClose: () => {
            close(id, position, userOnClose);
        },
        offset: verticalOffset,
        id: id,
        zIndex: 1010 + tIndex,
    };

    const vm: VNode = createVNode(Notice, options);
    const container = document.createElement('div');

    // 清除通知元素防止内存泄漏
    vm.props.onDestroy = () => {
        render(null, container);
    };

    notifications[position].push({ vm });

    // 当 close 函数被调用时，实例将删除此项。
    // 所以我们不需要担心。
    render(vm, container);

    document.body.appendChild(container.firstElementChild);
}

/**
  * 当用户点击`x` 按钮或按下`esc` 或时间达到其限制时，将调用此函数。
  * 由transition@before-leave 事件发出，以便我们可以获取当前的notification.offsetHeight，如果它被调用
  * 通过@after-leave DOM 元素将从页面中删除，因此我们无法再获取 offsetHeight。
  * @param {String} id 要关闭的通知 id
  * @param {Position} 定位定位策略
  * @param {Function} userOnClose 用户关闭时调用的回调
  */
const close = (
    id: string,
    position: Position,
    userOnClose?: (vm: VNode) => void,
): void => {
    // 将 vm 插入通知列表时存储索引
    const orientedNotifications = notifications[position];

    // 当前的下标
    const idx = orientedNotifications.findIndex(({ vm }) => vm.component.props.id === id);

    if (idx === -1) {
        return;
    }

    // vm
    const { vm } = orientedNotifications[idx];

    if (!vm) {
        return;
    }

    // 在通知从 DOM 中移除之前调用用户的关闭函数。
    userOnClose?.(vm);

    // 请注意，这称为@before-leave，这就是我们能够获取此属性的原因。
    const removedHeight = vm.el.offsetHeight;

    const verticalPos = position.split('-')[0];
    orientedNotifications.splice(idx, 1);
    const len = orientedNotifications.length;

    if (len < 1) {
        return;
    }

    // 开始移除项
    for (let i = idx; i < len; i++) {
        // 新位置等于当前的 offsetTop 减去移除的高度加上 16px（每个项目之间的间隙大小）
        const { el, component } = orientedNotifications[i].vm;
        const pos = parseInt(el.style[verticalPos], 10) - removedHeight - GAP_SIZE;
        component.props.offset = pos;
    }
};

// 关闭所有
const closeAll = (): void => {
    // 遍历所有方向，立即关闭它们。
    for (const key in notifications) {
        const orientedNotifications = notifications[key as Position];

        orientedNotifications.forEach(({ vm }) => {
            // same as the previous close method, we'd like to make sure lifecycle gets handle properly.
            (vm.component.proxy.data as ComponentPublicInstance<{ visible: boolean; }>).visible = false;
        });
    }
};

const notification = {
    open(options: options) {
        return notice('normal', options);
    },
    info(options: options) {
        return notice('info', options);
    },
    warning(options: options) {
        return notice('warning', options);
    },
    success(options: options) {
        return notice('success', options);
    },
    error(options: options) {
        return notice('error', options);
    },
    // 全局配置
    config(options) {
        // 偏移位置
        if (options.offset) {
            offset = options.offset;
        }

        // 延迟时间
        if (options.duration > 0) {
            defaultDuration = options.duration;
        }
    },
    close,
    closeAll
};

export default notification;
