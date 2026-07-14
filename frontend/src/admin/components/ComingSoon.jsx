import { IconBox } from './AdminIcons'

export default function ComingSoon({ title }) {
  return (
    <div className="adm-card adm-coming-soon">
      <div className="adm-coming-icon">
        <IconBox />
      </div>
      <h3>{title} — coming in Phase 3 Part 2</h3>
      <p>The full {title.toLowerCase()} management screen (list, create, edit, delete) is built in the next part of Phase 3.</p>
    </div>
  )
}
