// frontend/src/components/PostImageGrid.jsx
import './PostImageGrid.css';

export default function PostImageGrid({ images, onImageClick, alt = 'Post image' }) {
  // Normalize images to array
  const imgList = Array.isArray(images)
    ? images.filter(Boolean)
    : (images && typeof images === 'string' && images.trim() ? [images.trim()] : []);

  if (imgList.length === 0) return null;

  const count = imgList.length;

  if (count === 1) {
    return (
      <div className="post-images-grid grid-count-1">
        <div
          className="grid-item"
          onClick={(e) => {
            if (onImageClick) {
              e.stopPropagation();
              onImageClick(0, e);
            }
          }}
        >
          <img src={imgList[0]} alt={alt} loading="lazy" />
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="post-images-grid grid-count-2">
        {imgList.slice(0, 2).map((src, i) => (
          <div
            key={i}
            className="grid-item"
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(i, e);
              }
            }}
          >
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="post-images-grid grid-count-3">
        {imgList.slice(0, 3).map((src, i) => (
          <div
            key={i}
            className="grid-item"
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(i, e);
              }
            }}
          >
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="post-images-grid grid-count-4">
        {imgList.slice(0, 4).map((src, i) => (
          <div
            key={i}
            className="grid-item"
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(i, e);
              }
            }}
          >
            <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  // 5 or more images
  const remainingCount = count - 4;
  return (
    <div className="post-images-grid grid-count-more">
      {imgList.slice(0, 4).map((src, i) => (
        <div
          key={i}
          className="grid-item"
          onClick={(e) => {
            if (onImageClick) {
              e.stopPropagation();
              onImageClick(i, e);
            }
          }}
        >
          <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
          {i === 3 && remainingCount > 0 && (
            <div className="grid-more-overlay">
              +{remainingCount + 1}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
