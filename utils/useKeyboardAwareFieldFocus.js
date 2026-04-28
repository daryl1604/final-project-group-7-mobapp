import { useCallback, useEffect, useRef } from "react";
import { findNodeHandle, Keyboard, Platform } from "react-native";

const DEFAULT_RETRY_DELAYS = [0, 80, 180];

export default function useKeyboardAwareFieldFocus({
  scrollRef,
  extraScrollHeight = 88,
  retryDelays = DEFAULT_RETRY_DELAYS,
}) {
  const inputRefs = useRef({});
  const activeFieldRef = useRef(null);
  const retryTimeoutsRef = useRef([]);

  const clearScheduledScrolls = useCallback(() => {
    retryTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    retryTimeoutsRef.current = [];
  }, []);

  const scrollToField = useCallback(
    (field, animated = true) => {
      const scrollView = scrollRef.current;
      const input = inputRefs.current[field];
      const inputHandle = findNodeHandle(input);
      const scrollResponder =
        typeof scrollView?.getScrollResponder === "function" ? scrollView.getScrollResponder() : scrollView;

      if (!inputHandle || !scrollResponder?.scrollResponderScrollNativeHandleToKeyboard) {
        return false;
      }

      scrollResponder.scrollResponderScrollNativeHandleToKeyboard(inputHandle, extraScrollHeight, animated);
      return true;
    },
    [extraScrollHeight, scrollRef]
  );

  const scheduleScrollToField = useCallback(
    (field) => {
      clearScheduledScrolls();

      retryDelays.forEach((delay) => {
        const timeoutId = setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToField(field);
          });
        }, delay);

        retryTimeoutsRef.current.push(timeoutId);
      });
    },
    [clearScheduledScrolls, retryDelays, scrollToField]
  );

  const handleFieldFocus = useCallback(
    (field) => () => {
      activeFieldRef.current = field;
      scheduleScrollToField(field);
    },
    [scheduleScrollToField]
  );

  const registerInputRef = useCallback(
    (field) => (input) => {
      if (input) {
        inputRefs.current[field] = input;
        return;
      }

      delete inputRefs.current[field];
    },
    []
  );

  const focusField = useCallback(
    (field) => {
      const input = inputRefs.current[field];

      if (!input) {
        return false;
      }

      activeFieldRef.current = field;
      input.focus?.();
      scheduleScrollToField(field);
      return true;
    },
    [scheduleScrollToField]
  );

  useEffect(() => {
    const showEventName = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEventName = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEventName, () => {
      if (activeFieldRef.current) {
        scheduleScrollToField(activeFieldRef.current);
      }
    });

    const hideSubscription = Keyboard.addListener(hideEventName, () => {
      clearScheduledScrolls();
    });

    return () => {
      clearScheduledScrolls();
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [clearScheduledScrolls, scheduleScrollToField]);

  return {
    handleFieldFocus,
    focusField,
    registerInputRef,
    scrollToField,
  };
}
