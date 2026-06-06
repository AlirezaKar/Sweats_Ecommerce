type JsonValue = Record<string, unknown>;

type Props = {
  data: JsonValue | JsonValue[];
};

export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data) ? data : data;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
