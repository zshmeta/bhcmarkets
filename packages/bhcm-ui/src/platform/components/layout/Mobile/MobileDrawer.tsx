import { useRef, useEffect, useState, useCallback } from 'react';
import { Icons } from '../Icons';
import { Overlay, Drawer, HandleArea, Handle, Header, Title, CloseBtn, Content } from './MobileDrawer.styles';

/**
 * MOBILE DRAWER - Bottom sheet with drag-to-close
 */

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
  showHandle?: boolean;
  draggable?: boolean;
}

const MobileDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'half',
  showHandle = true,
  draggable = true,
}: MobileDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!draggable || !e.touches[0]) return;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  }, [draggable]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !draggable || !e.touches[0]) return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0) setDragOffset(diff);
  }, [isDragging, draggable]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) onClose();
    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  useEffect(() => { if (!isOpen) setDragOffset(0); }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <Overlay $visible={isOpen} onClick={onClose} />
      <Drawer
        ref={drawerRef}
        $open={isOpen}
        $height={height}
        style={{ transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined, transition: isDragging ? 'none' : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showHandle && <HandleArea><Handle /></HandleArea>}
        {title && (
          <Header>
            <Title>{title}</Title>
            <CloseBtn onClick={onClose}><Icons name="x" size="md" /></CloseBtn>
          </Header>
        )}
        <Content>{children}</Content>
      </Drawer>
    </>
  );
}

export { MobileDrawer };
