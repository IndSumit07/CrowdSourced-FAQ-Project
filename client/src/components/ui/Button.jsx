const baseStyles =
  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition duration-200 ease-out";

const variants = {
  primary: "bg-[#1f1a2e] text-white shadow-strong hover:-translate-y-0.5",
  ghost:
    "border border-[#1f1a2e]/15 bg-white text-[#1f1a2e] hover:-translate-y-0.5",
};

const Button = ({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export default Button;
