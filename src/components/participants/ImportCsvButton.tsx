import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'

interface ImportCsvButtonProps {
  onFile: (file: File) => void
}

/** Кнопка загрузки CSV-файла со списком участников */
export function ImportCsvButton({ onFile }: ImportCsvButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    // сброс, чтобы повторный выбор того же файла тоже вызвал событие
    event.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="CSV-файл со списком участников"
        onChange={handleChange}
      />
      <Button onClick={() => inputRef.current?.click()}>📄 Импорт CSV</Button>
    </>
  )
}
