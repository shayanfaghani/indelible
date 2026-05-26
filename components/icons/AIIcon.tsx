interface Props {
    size?: number;
    className?: string;
}

export default function AIIcon({ size = 20, className = "" }: Props) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 22 22"
            fill="currentColor"
            aria-hidden="true"
            className={className}
        >
            {/* "AI" lettering */}
            <text
                x="0"
                y="17"
                fontSize="14"
                fontWeight="800"
                fontFamily="system-ui,-apple-system,BlinkMacSystemFont,sans-serif"
            >
                AI
            </text>
            {/* 4-pointed sparkle — top-right */}
            <path d="M19.5 1l.75 2.25L22.5 4l-2.25.75L19.5 7l-.75-2.25L16.5 4l2.25-.75z" />
        </svg>
    );
}
