"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "framer-motion";

type ButtonState = "idle" | "loading" | "success" | "error";

interface AnimatedSubmitButtonProps extends HTMLMotionProps<"button"> {
    state: ButtonState;
    successText?: string;
    errorText?: string;
}

export function AnimatedSubmitButton({
    state,
    successText = "Success",
    errorText = "Something went wrong",
    children,
    disabled,
    ...props
}: AnimatedSubmitButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [initialWidth, setInitialWidth] = useState<number | null>(null);

    // اندازه واقعی دکمه را همیشه دنبال می‌کنیم
    useEffect(() => {
        const button = buttonRef.current;

        if (!button) return;

        const updateWidth = () => {
            // فقط وقتی در حالت idle هستیم
            // عرض اصلی را ذخیره می‌کنیم
            if (state === "idle") {
                setInitialWidth(button.getBoundingClientRect().width);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);

        resizeObserver.observe(button);

        return () => {
            resizeObserver.disconnect();
        };
    }, [state]);

    const isLoading = state === "loading";
    const isSuccess = state === "success";
    const isError = state === "error";

    return (
        <motion.button
            ref={buttonRef}
            type="submit"
            disabled={disabled || isLoading}
            animate={{
                width:
                    isLoading || isSuccess || isError
                        ? 48
                        : initialWidth ?? "auto",
            }}
            transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
            }}
            style={{
                height: 48,
                overflow: "hidden",
                whiteSpace: "nowrap",
            }}
            {...props}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isLoading && (
                    <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Spinner />
                    </motion.span>
                )}

                {isSuccess && (
                    <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CheckIcon />
                    </motion.span>
                )}

                {isError && (
                    <motion.span
                        key="error"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <XIcon />
                    </motion.span>
                )}

                {state === "idle" && (
                    <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

function Spinner() {
    return (
        <motion.span
            style={{
                display: "block",
                width: 20,
                height: 20,
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
            }}
            animate={{ rotate: 360 }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "linear",
            }}
        />
    );
}

function CheckIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12l4 4L19 6" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
        >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </svg>
    );
}