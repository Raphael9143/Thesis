import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import userAPI from '../../../services/userAPI';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../assets/styles/components/ui/UMLPreview.css';
import { offsetAlong, pushOutward, intersectBorder } from '../../utils/umlUtils';
import useBoxMeasurements from '../../hooks/useBoxMeasurements';
import useBoxDrag from '../../hooks/useBoxDrag';
import useRoleDrag from '../../hooks/useRoleDrag';
import UMLHeader from '../../components/ui/uml/UMLHeader';
import UMLCanvas from '../../components/ui/uml/UMLCanvas';
import UMLRoles from '../../components/ui/uml/UMLRoles';
import UMLClasses from '../../components/ui/uml/UMLClasses';

export default function UMLPage() {
  const location = useLocation();
  const { state } = location;
  const { search } = location;
  const params = new URLSearchParams(search);
  const qfile = params.get('file');

  const [modelState, setModelState] = useState(state?.model || null);
  const [cliState, setCliState] = useState(state?.cli || null);
  const model = modelState;
  const cli = cliState;
  const { push } = useNotifications();
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelError, setModelError] = useState(null);
  const loadingFilesRef = useRef({});

  const navigate = useNavigate();

  const containerRef = useRef(null);
  const [positions, setPositions] = useState({});
  const positionsRef = useRef(positions);
  const boxRefs = useRef({});

  const classes = useMemo(() => model?.classes || [], [model]);
  const enums = useMemo(() => model?.enums || [], [model]);
  const associations = useMemo(() => model?.associations || [], [model]);

  const BOX_W = 220;
  const GAP_X = 40;
  const GAP_Y = 40;
  const BOX_MIN_H = 60;

  const { centerOf, getRect } = useBoxMeasurements({
    boxRefs,
    positions,
    containerRef,
    BOX_W,
    BOX_MIN_H,
  });

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    const p = {};
    const perRow = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, classes.length))));
    classes.forEach((c, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      p[c.name] = { x: col * (BOX_W + GAP_X) + 40, y: row * (BOX_MIN_H + GAP_Y) + 40 };
    });
    enums.forEach((e, i) => {
      p[`enum:${e.name}`] = {
        x: (perRow + 1) * (BOX_W + GAP_X) + 40,
        y: i * (BOX_MIN_H + GAP_Y) + 40,
      };
    });
    setPositions(p);
  }, [classes, enums]);

  const { startDrag } = useBoxDrag({ setPositions, containerRef, positionsRef });

  const { rolePositions, setRolePositions, startRoleDrag, roleActiveKey, rolePreviewTarget } =
    useRoleDrag({
      boxRefs,
      containerRef,
      initialPositions: {},
    });

  useEffect(() => {
    const rp = {};
    associations.forEach((a, i) => {
      const parts = Array.isArray(a.parts) ? a.parts : [];
      const centers = parts.map((p) => ({
        name: p.class,
        center: centerOf(p.class),
        rect: getRect(p.class),
        raw: p,
      }));
      centers.forEach((c, idx) => {
        if (!c.center) return;
        const other = centers.find((x) => x !== c && x.center) || {
          center: { x: c.center.x + 20, y: c.center.y },
        };
        const p = c.rect
          ? intersectBorder(c.rect, c.center, other.center)
          : offsetAlong(c.center, other.center, 14);
        rp[`${i}:${idx}`] = pushOutward(p, c.center, 18);
      });
    });
    setRolePositions(rp);
  }, [positions, associations, centerOf, getRect, setRolePositions]);

  useEffect(() => {
    if (modelState) return; // already have model
    const load = async () => {
      const fileKey = qfile;
      if (!fileKey) {
        setModelError('No file specified to parse for UML.');
        return;
      }

      // Prevent duplicate loads for the same file (covers React Strict Mode double mount)
      if (loadingFilesRef.current[fileKey]) return;
      loadingFilesRef.current[fileKey] = true;

      const decoded = decodeURIComponent(fileKey);
      try {
        // try sessionStorage first
        const stored = sessionStorage.getItem(`uml_preview_${fileKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setModelState(parsed.model);
          setCliState(parsed.cli || null);
          return;
        }
      } catch (err) {
        console.warn('Failed to load UML model from sessionStorage', err);
      }
      try {
        setLoadingModel(true);
        const res = await userAPI.parseUseModel(decoded);
        if (!res || res.success === false) {
          const msg =
            res?.message ||
            (Array.isArray(res?.details) && res.details.join('\n')) ||
            res?.cli?.stdout ||
            'Invalid .use file.';
          setModelError(msg);
          try {
            push({ title: 'USE parse', body: msg });
          } catch (err) {
            console.warn('Notification push error', err);
          }
          return;
        }
        setModelState(res.model);
        setCliState(res.cli?.stdout || res.cli?.stderr || null);
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to parse model';
        setModelError(msg);
        try {
          push({ title: 'Error', body: msg });
        } catch (err) {
          console.warn('Notification push error', err);
        }
      } finally {
        setLoadingModel(false);
        loadingFilesRef.current[fileKey] = false;
      }
    };
    load();
  }, [modelState, qfile, push]);

  if (!model) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ marginTop: 12 }}>
          {loadingModel ? 'Parsing model...' : modelError || 'No UML model provided for preview.'}
        </h3>
      </div>
    );
  }

  return (
    <div className="uml-page">
      <div
        style={{
          padding: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>UML Preview - {model.model || 'Model'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              // navigate to editor, pass current parsed model in router state
              navigate('/uml/editor', { state: { model } });
            }}
          >
            Edit
          </button>
        </div>
      </div>
      <div className="uml-page-body" ref={containerRef} style={{ border: '1px solid #eee' }}>
        <UMLCanvas
          associations={associations}
          classes={classes}
          centerOf={centerOf}
          getRect={getRect}
          roleActiveKey={roleActiveKey}
          rolePositions={rolePositions}
          rolePreviewTarget={rolePreviewTarget}
        />

        <UMLRoles
          rolePositions={rolePositions}
          associations={associations}
          startRoleDrag={startRoleDrag}
          roleActiveKey={roleActiveKey}
        />

        <UMLClasses
          classes={classes}
          enums={enums}
          positions={positions}
          boxRefs={boxRefs}
          startDrag={startDrag}
          BOX_W={BOX_W}
          BOX_MIN_H={BOX_MIN_H}
        />
      </div>

      {cli && (
        <details style={{ padding: 8, borderTop: '1px solid #eee' }}>
          <summary>
            <a>CLI format</a>
          </summary>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{cli}</pre>
        </details>
      )}
    </div>
  );
}
