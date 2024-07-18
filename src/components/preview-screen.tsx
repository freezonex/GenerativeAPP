const PreviewScreen = ({
  previewRef,
}: {
  previewRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div
      id="preview"
      ref={previewRef}
      className="w-full h-full bg-white rounded-lg  shadow-lg p-2 border"
    >
      {/* <div dangerouslySetInnerHTML={{ __html: html_code }} /> */}
    </div>
  );
};
export default PreviewScreen;
