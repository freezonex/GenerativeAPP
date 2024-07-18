'use client';

import { StreamableValue, useStreamableValue } from 'ai/rsc';

export function AIMessage(props: { value: StreamableValue<string> }) {
  const [data] = useStreamableValue(props.value);

  if (!data) {
    return null;
  }
  return <p>{data}</p>;
}
