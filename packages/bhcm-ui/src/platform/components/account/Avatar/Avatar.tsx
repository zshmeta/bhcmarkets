import { useRef, useState, useCallback } from 'react';
import { Icons } from '../Icons';
import { useI18n } from '../../i18n';
import {
  Container,
  HiddenFileInput,
  AvatarWrapper,
  AvatarImage,
  Placeholder,
  Overlay,
  OverlayText,
  SpinnerIcons,
  RemoveButton,
  type AvatarSize,
} from './Avatar.styles';

/* ═══════════════════════════════════════════════════════════
 * AVATAR UPLOAD COMPONENT
 * ═══════════════════════════════════════════════════════════
 * A circular avatar display with optional upload functionality.
 * 
 * Features:
 * - Three size variants (sm/md/lg)
 * - Hover state with camera Icons overlay
 * - Image processing: resize + circular crop
 * - Remove button on hover when avatar exists
 * - Loading state during file processing
 * 
 * Pattern: Hidden Input + Click Handler
 * The visible avatar triggers a hidden <input type="file">.
 */

/* ─── Props Interface ─── */
interface AvatarProps {
  /** Current avatar as data URL or null */
  currentAvatar: string | null;
  /** Callback when avatar changes (data URL or null for removal) */
  onAvatarChange: (dataUrl: string | null) => void;
  /** Size variant */
  size?: AvatarSize;
  /** Whether user can edit the avatar */
  editable?: boolean;
}

/* ─── Icons Size Mapping ───
 * Maps avatar size to appropriate Icons size.
 */
const Icons_SIZES: Record<AvatarSize, 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  currentAvatar,
  onAvatarChange,
  size = 'md',
  editable = true,
}) => {
  const { t } = useI18n();

  /* ─── Refs & State ─── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ─── File Selection Handler ───
   * Validates file type/size, then processes the image.
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate: must be an image
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate: max 5MB to prevent memory issues
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setIsProcessing(true);

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const resizedDataUrl = await resizeImage(dataUrl, 256);
        onAvatarChange(resizedDataUrl);
      } catch (error) {
        console.error('Failed to process avatar:', error);
      } finally {
        setIsProcessing(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onAvatarChange]
  );

  /* ─── Click Handler ───
   * Triggers the hidden file input.
   */
  const handleClick = useCallback(() => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [editable]);

  /* ─── Remove Handler ───
   * Clears the avatar. stopPropagation prevents triggering upload.
   */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAvatarChange(null);
    },
    [onAvatarChange]
  );

  return (
    <Container
      $size={size}
      $editable={editable}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {/* Hidden file input triggered programmatically */}
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={!editable || isProcessing}
      />

      <AvatarWrapper
        $size={size}
        $editable={editable}
        $isHovering={isHovering}
      >
        {/* Avatar image or placeholder */}
        {currentAvatar ? (
          <AvatarImage src={currentAvatar} alt="Avatar" />
        ) : (
          <Placeholder>
            <Icons name="user" size={Icons_SIZES[size]} />
          </Placeholder>
        )}

        {/* Hover overlay: camera Icons + text */}
        {editable && isHovering && !isProcessing && (
          <Overlay>
            <Icons name="camera" size="md" />
            <OverlayText $size={size}>
              {t.settings?.profile?.changeAvatar || 'Change'}
            </OverlayText>
          </Overlay>
        )}

        {/* Processing overlay: spinner */}
        {isProcessing && (
          <Overlay>
            <SpinnerIcons>
              <Icons name="loader" size="md" />
            </SpinnerIcons>
          </Overlay>
        )}
      </AvatarWrapper>

      {/* Remove button (positioned absolutely) */}
      {editable && currentAvatar && isHovering && !isProcessing && (
        <RemoveButton
          $size={size}
          onClick={handleRemove}
          title={t.common?.delete || 'Remove'}
        >
          <Icons name="x" size="xs" />
        </RemoveButton>
      )}
    </Container>
  );
};

/* ═══════════════════════════════════════════════════════════
 * HELPER: Read File as Data URL
 * ═══════════════════════════════════════════════════════════
 * Wraps FileReader in a Promise for async/await usage.
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════════════════════════
 * HELPER: Resize Image
 * ═══════════════════════════════════════════════════════════
 * Resizes image to square, crops to center, applies circular clip.
 * This reduces file size and ensures consistent avatar dimensions.
 */
function resizeImage(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Crop to square: use smaller dimension
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      canvas.width = maxSize;
      canvas.height = maxSize;

      // Circular clip path for rounded avatar
      ctx.beginPath();
      ctx.arc(maxSize / 2, maxSize / 2, maxSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw cropped and scaled image
      ctx.drawImage(img, x, y, size, size, 0, 0, maxSize, maxSize);

      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
