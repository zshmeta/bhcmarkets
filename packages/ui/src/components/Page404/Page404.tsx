import { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import Page404 from "@repo/ui"; // Renamed to avoid collision with component
// import VideoSrc from "../../assets/Page404.mp4"; // Renamed to avoid collision with component


export type Page404Props = {
  videoSrc?: string; // Made optional for default fallback
  posterSrc?: string;
  headline?: string;
  message?: string;
  onGoHome?: () => void; // Added handler for navigation
} & React.HTMLAttributes<HTMLElement>;

// 1. The Base: Holds the video
const Root = styled.main`
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: black;
`;

// 2. The Video Layer: Sits at the very back
const VideoFrame = styled.video`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.8; // Slight fade to ensure text contrast isn't too jarring
`;

// 3. The Knockout Layer: This creates the "Mask"
// We use isolation: isolate to ensure blend modes happen inside this container
const KnockoutContainer = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  isolation: isolate;
  background: ${({ theme }) => theme.colors.backgrounds.app}; // The "Solid" color covering the screen
`;

const wave = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

// 4. The Text: Cuts a hole in the KnockoutContainer to reveal the video
const CutoutText = styled.div`
  text-align: center;
  mix-blend-mode: destination-out; // This makes the text transparent, revealing the video behind the background
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Char = styled.span`
  display: inline-block;
  will-change: transform;
  animation: ${wave} 2s cubic-bezier(0.45, 0, 0.55, 1) infinite; // Slightly smoother cubic-bezier
  animation-delay: calc(var(--i) * 60ms); // Slower ripple for more elegance

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.headingsFamily};
  font-weight: 900; // Extra bold for better video visibility
  font-size: clamp(80px, 20vw, 250px);
  line-height: 0.85;
  letter-spacing: -0.04em;
  margin: 0;
`;

const Message = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-family: ${({ theme }) => theme.typography.headingsFamily};
  font-weight: 700;
  font-size: clamp(24px, 4vw, 50px);
  letter-spacing: -0.02em;
`;


const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// Hook Logic
function useWaveNodes(text: string, startIndex: number) {
  return useMemo(() => {
    let idx = startIndex;
    return Array.from(text).map((ch, i) => {
      if (ch === " ") return " ";
      const style = { "--i": idx } as React.CSSProperties;
      idx += 1;
      return <Char key={i} style={style} aria-hidden="true">{ch}</Char>;
    });
  }, [text, startIndex]);
}

export function Page404({
    videoSrc = VideoSrc,
    posterSrc,
    headline = "404",
    message = "Page Not Found",
    onGoHome,
    ...rest
}: Page404Props) {
    // Determine distinct delay start times so the wave flows from top line to bottom line
    const headlineNodes = useWaveNodes(headline, 0);
    const messageNodes = useWaveNodes(message, headline.replace(/\s/g, "").length);

    return (
    <Root {...rest}>
      {/* Layer 1: The Video */}
      <VideoFrame autoPlay muted loop playsInline poster={posterSrc}>
        <source src={videoSrc} type="video/mp4" />
      </VideoFrame>

      {/* Layer 2: The Solid Background with "Holes" for text */}
      <KnockoutContainer>
          <CutoutText>
              <Headline>
                  <SrOnly>{headline}</SrOnly>
                  {headlineNodes}
              </Headline>
              <Message>
                  <SrOnly>{message}</SrOnly>
                  {messageNodes}
              </Message>
          </CutoutText>
      </KnockoutContainer>
    </Root>
  );
}

Page404.displayName = "Page404";

export default Page404;
