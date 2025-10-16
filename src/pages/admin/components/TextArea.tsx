interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export default function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 bg-dr7-darker border border-gray-700 rounded text-white focus:outline-none focus:border-dr7-gold transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}
