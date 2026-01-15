import { useRef, useEffect, useState } from 'react';
import { Container, Segment, Indicator, Badge, Label, IconsWrapper } from './MobileSegmentedControl.styles';

/**
 * MOBILE SEGMENTED CONTROL - Pills or underline tabs
 */

interface SegmentType {
  id: string;
  label: string;
  Icons?: React.ReactNode;
  badge?: number;
}

interface MobileSegmentedControlProps {
  segments: SegmentType[];
  activeId: string;
  onChange: (id: string) => void;
  scrollable?: boolean;
  variant?: 'pills' | 'underline';
}

const MobileSegmentedControl = ({
  segments, activeId, onChange, scrollable = false, variant = 'pills',
}: MobileSegmentedControlProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: activeRect.width,
      });
      if (scrollable) {
        const scrollLeft = activeRef.current.offsetLeft - containerRect.width / 2 + activeRect.width / 2;
        containerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeId, scrollable, segments]);

  return (
    <Container ref={containerRef} $variant={variant} $scrollable={scrollable}>
      {variant === 'underline' && <Indicator style={{ left: indicatorStyle.left, width: indicatorStyle.width }} />}
      {segments.map((segment) => (
        <Segment
          key={segment.id}
          ref={segment.id === activeId ? activeRef : null}
          $active={segment.id === activeId}
          $variant={variant}
          onClick={() => onChange(segment.id)}
        >
          {segment.Icons && <IconsWrapper>{segment.Icons}</IconsWrapper>}
          <Label>{segment.label}</Label>
          {segment.badge !== undefined && segment.badge > 0 && <Badge>{segment.badge > 99 ? '99+' : segment.badge}</Badge>}
        </Segment>
      ))}
    </Container>
  );
}

export default MobileSegmentedControl;
