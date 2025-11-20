import React from 'react';
import FilePreview from '../../components/ui/FilePreview';
import DashedDivider from '../../components/ui/DashedDivider';
import toFullUrl from '../../utils/FullURLFile';

export default function ContributionDetailsTab({ contribution, useModel }) {
  return (
    <div className="contribution-detail-tab-content">
      <div className="contribution-detail-description">
        <h3>Description</h3>
        <p>{contribution.description}</p>
      </div>

      <DashedDivider />

      {useModel && (
        <div className="contribution-detail-model-section">
          <h3>Model: {useModel.name}</h3>
          <div className="contribution-detail-model-preview">
            <FilePreview
              url={toFullUrl(useModel.file_path)}
              filename={useModel.file_path}
              filePath={useModel.file_path}
            />
          </div>
        </div>
      )}

      {contribution.review_notes && (
        <>
          <DashedDivider />
          <div className="contribution-detail-review-notes">
            <h3>Review Notes</h3>
            <p>{contribution.review_notes}</p>
          </div>
        </>
      )}

      {contribution.validation_report && (
        <>
          <DashedDivider />
          <div className="contribution-detail-validation">
            <h3>Validation Report</h3>
            <pre>{contribution.validation_report}</pre>
          </div>
        </>
      )}
    </div>
  );
}
