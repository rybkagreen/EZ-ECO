import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
    visible: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    items,
    onClose,
    visible
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                left: x,
                top: y,
            }}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    className={`context-menu__item ${item.disabled ? 'context-menu__item--disabled' : ''} ${item.danger ? 'context-menu__item--danger' : ''}`}
                    onClick={() => {
                        if (!item.disabled) {
                            item.onClick();
                            onClose();
                        }
                    }}
                    disabled={item.disabled}
                >
                    {item.icon && <span className="context-menu__icon">{item.icon}</span>}
                    <span className="context-menu__label">{item.label}</span>
                </button>
            ))}
        </div>
    );
};
