import { STREAM_COLORS } from '../../utils/colors'

interface Props { selected: string; onSelect: (c: string) => void }

export function ColorPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {STREAM_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="w-8 h-8 rounded-full border-0 cursor-pointer transition-transform hover:scale-110"
          style={{ background: c, outline: selected === c ? `3px solid #1F2937` : '3px solid transparent', outlineOffset: 2 }}
          title={c}
        />
      ))}
    </div>
  )
}
