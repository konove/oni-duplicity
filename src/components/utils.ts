/**
 * Should a link click be handled by the router rather than the browser?
 *
 * Mirrors the check react-router's own Link performs: only plain left clicks
 * that nothing else has already handled get intercepted, so middle-click,
 * ctrl-click and `target="_blank"` keep their native behaviour.
 */
export function shouldNavigate(
  event: React.MouseEvent<HTMLElement>,
  target?: string
): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    (!target || target === "_self") &&
    !isModifierPressed(event)
  );
}

function isModifierPressed(event: React.MouseEvent<any>) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
