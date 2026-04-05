import React from 'react';

interface SearchButtonProps {
  username: string;
  isCommentsSection: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({ username, isCommentsSection }) => {
  const handleClick = () => {
    const searchUrl = `https://arctic-shift.photon-reddit.com/search?fun=posts_search&author=${username}&limit=10&sort=desc`;
    const searchCommentsUrl = `https://arctic-shift.photon-reddit.com/search?fun=comments_search&author=${username}&limit=10&sort=desc`;
    
    const targetUrl = isCommentsSection ? searchCommentsUrl : searchUrl;

    // Opens the URL in a new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#0079D3',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Search Archive on Arctic Shift
    </button>
  );
};

export default SearchButton;