import { Eye, Upload, X } from 'lucide-react'

const ACCEPTED_MEDIA_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
]

export function mediaKind(type) {
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type === 'application/pdf') return 'pdf'
  return 'file'
}

function MediaPanel({ activeCampaign, currentUser, mediaItems, onDisplayMedia, onRemoveMedia, onUploadMedia, setMessages }) {
  const isDm = Boolean(currentUser?.id && activeCampaign?.owner_id === currentUser.id)

  const uploadMedia = (event) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => ACCEPTED_MEDIA_TYPES.includes(file.type))
    const invalidCount = files.length - validFiles.length

    if (invalidCount > 0) {
      setMessages((prev) => [...prev, `${invalidCount} media file(s) skipped.`])
    }

    if (validFiles.length > 0) onUploadMedia(validFiles)
    event.target.value = ''
  }

  return (
    <section className="media-panel">
      {isDm && (
        <label className="media-upload">
          <Upload size={16} />
          <span>Upload Media</span>
          <input
            type="file"
            multiple
            accept={ACCEPTED_MEDIA_TYPES.join(',')}
            onChange={uploadMedia}
          />
        </label>
      )}

      <div className="media-list">
        {mediaItems.length === 0 ? (
          <p className="media-empty">No media uploaded.</p>
        ) : mediaItems.map((item) => (
          <article className="media-item" key={item.id}>
            <div className="media-thumb">
              {item.kind === 'image' ? (
                <img src={item.url} alt="" />
              ) : (
                <span>{item.kind.toUpperCase()}</span>
              )}
            </div>
            <div>
              <strong>{item.name}</strong>
              <span>{item.kind}</span>
            </div>
            <button type="button" title="Display media" onClick={() => onDisplayMedia(item)}>
              <Eye size={15} />
            </button>
            {isDm && (
              <button className="danger" type="button" title="Remove media" onClick={() => onRemoveMedia(item.id)}>
                <X size={15} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MediaPanel
