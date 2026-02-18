"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  CheckIcon,
  ExternalLinkIcon,
  SettingsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavWalletProps {
  wallet: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}

// Types
interface Notification {
  id: string;
  type: "transaction" | "system" | "security" | "price";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "transaction",
    title: "Transaction Confirmed",
    description: "Your transaction of 0.5 SAL has been confirmed.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: "/transaction-history",
    actionLabel: "View",
  },
  {
    id: "notif-2",
    type: "price",
    title: "Price Alert",
    description: "SAL is up 5.2% in the last 24 hours.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: "notif-3",
    type: "security",
    title: "New Login Detected",
    description: "A new login was detected from Chrome on MacOS.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
];

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return `${diffDays}d ago`;
}

function getNotificationIcon(type: Notification["type"]) {
  const icons = {
    transaction: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
        <svg
          className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M7 17L17 7M17 7H7M17 7V17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    price: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/30">
        <svg
          className="h-4 w-4 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    security: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
        <svg
          className="h-4 w-4 text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    system: (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30">
        <svg
          className="h-4 w-4 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
  };
  return icons[type];
}

export function NavWallet({ wallet }: NavWalletProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Calculate panel position when opening
  useEffect(() => {
    if (notificationsOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [notificationsOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden relative">
      <SidebarGroupLabel className="font-mono uppercase text-xs tracking-wide">
        Wallet
      </SidebarGroupLabel>
      <SidebarMenu>
        {wallet.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.name === "Notifications" ? (
              <div className="relative">
                <SidebarMenuButton asChild>
                  <button
                    className="flex w-full items-center gap-2"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    ref={buttonRef}
                    type="button"
                  >
                    <item.icon className="text-muted-foreground" />
                    <span>{item.name}</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>

                {/* Notification Panel - positioned to the right of the Notifications menu item */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      {/* Backdrop blur overlay - only blur the main content area, not sidebar */}
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="fixed z-40 bg-black/20 backdrop-blur-sm"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClick={() => setNotificationsOpen(false)}
                        style={{
                          left: "var(--sidebar-width, 280px)",
                          top: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />

                      {/* Panel - positioned relative to the Notifications menu item */}
                      <motion.div
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="fixed z-50 w-[320px] rounded-lg border border-border bg-background shadow-2xl"
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        ref={panelRef}
                        style={{
                          top: panelPosition.top,
                          left: panelPosition.left,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <BellIcon className="h-4 w-4" />
                            <span className="font-semibold text-sm">
                              Notifications
                            </span>
                            {unreadCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              className="h-7 w-7"
                              onClick={handleMarkAllAsRead}
                              size="icon"
                              title="Mark all as read"
                              type="button"
                              variant="ghost"
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              className="h-7 w-7"
                              onClick={() => setNotificationsOpen(false)}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[320px] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-border/50">
                              {notifications.map((notification) => (
                                <motion.div
                                  animate={{ opacity: 1, x: 0 }}
                                  className={cn(
                                    "group relative p-3 transition-colors hover:bg-accent/50",
                                    !notification.read && "bg-primary/5"
                                  )}
                                  exit={{ opacity: 0, x: -20 }}
                                  initial={{ opacity: 0, x: -10 }}
                                  key={notification.id}
                                  layout
                                >
                                  {/* Unread indicator */}
                                  {!notification.read && (
                                    <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                                  )}

                                  <div className="flex gap-3 pl-2">
                                    {getNotificationIcon(notification.type)}

                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-sm">
                                          {notification.title}
                                        </h4>
                                        <span className="shrink-0 text-muted-foreground text-[10px]">
                                          {formatTimeAgo(
                                            notification.timestamp
                                          )}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                                        {notification.description}
                                      </p>

                                      {/* Actions */}
                                      <div className="mt-1.5 flex items-center gap-1.5">
                                        {notification.actionUrl && (
                                          <Button
                                            className="h-6 gap-1 px-2 text-[10px]"
                                            onClick={() =>
                                              window.open(
                                                notification.actionUrl,
                                                "_self"
                                              )
                                            }
                                            type="button"
                                            variant="outline"
                                          >
                                            {notification.actionLabel}
                                            <ExternalLinkIcon className="h-3 w-3" />
                                          </Button>
                                        )}
                                        {!notification.read && (
                                          <Button
                                            className="h-6 px-2 text-[10px]"
                                            onClick={() =>
                                              handleMarkAsRead(notification.id)
                                            }
                                            type="button"
                                            variant="ghost"
                                          >
                                            Mark read
                                          </Button>
                                        )}
                                        <Button
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                          onClick={() =>
                                            handleDismiss(notification.id)
                                          }
                                          size="icon"
                                          type="button"
                                          variant="ghost"
                                        >
                                          <Trash2Icon className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <BellIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <p className="font-medium text-sm">
                                No notifications
                              </p>
                              <p className="text-muted-foreground text-xs">
                                You're all caught up!
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-border/50 bg-background px-3 py-2">
                          <Button
                            className="w-full gap-1.5 text-xs"
                            type="button"
                            variant="ghost"
                          >
                            <SettingsIcon className="h-3.5 w-3.5" />
                            Notification Settings
                          </Button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon className="text-muted-foreground" />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
